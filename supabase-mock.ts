// Mock Supabase client for testing when real backend is unavailable
// This allows testing the UI/flow without network connectivity


// Simulated user storage
let mockUsers: { [key: string]: any } = {};
let mockWaterEntries: { [key: string]: any } = {};
let currentUserId: string | null = null;

export const supabase = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      console.log('MOCK signUp:', email);
      const userId = `user_${Date.now()}`;
      mockUsers[userId] = {
        id: userId,
        email,
        password, // in real app, never store plain text
        ...options?.data,
      };
      currentUserId = userId;
      return { data: { user: mockUsers[userId] }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      console.log('MOCK signInWithPassword:', email);
      const user = Object.values(mockUsers).find(
        (u: any) => u.email === email && u.password === password
      );
      if (!user) {
        return { data: null, error: { message: 'Invalid credentials' } };
      }
      currentUserId = (user as any).id;
      return { data: { user }, error: null };
    },
    getUser: async () => {
      console.log('MOCK getUser:', currentUserId);
      return {
        data: { user: currentUserId ? mockUsers[currentUserId] : null },
      };
    },
    signOut: async () => {
      console.log('MOCK signOut');
      currentUserId = null;
      return { error: null };
    },
  },
  from: (tableName: string) => ({
    select: (columns: string) => ({
      eq: (col: string, val: string) => ({
        order: (orderCol: string, opts: any) => ({
          then: async (cb: any) => {
            console.log(`MOCK select from ${tableName}:`, { columns, eq: { [col]: val }, order: orderCol });
            const entries = Object.values(mockWaterEntries)
              .filter((e: any) => e[col] === val)
              .sort((a: any, b: any) => {
                const aVal = a[orderCol];
                const bVal = b[orderCol];
                return opts.ascending
                  ? new Date(aVal).getTime() - new Date(bVal).getTime()
                  : new Date(bVal).getTime() - new Date(aVal).getTime();
              });
            cb({ data: entries, error: null });
            return { data: entries, error: null };
          },
          catch: () => ({ data: [], error: null }),
        }),
      }),
    }),
    insert: (records: any[]) => ({
      select: () => ({
        single: async () => {
          console.log(`MOCK insert into ${tableName}:`, records);
          const record = { id: `id_${Date.now()}`, ...records[0], created_at: new Date().toISOString() };
          mockWaterEntries[record.id] = record;
          return { data: record, error: null };
        },
      }),
    }),
    update: (updates: any) => ({
      eq: (col: string, val: string) => ({
        select: () => ({
          single: async () => {
            console.log(`MOCK update ${tableName}:`, { updates, eq: { [col]: val } });
            const entry = Object.values(mockWaterEntries).find((e: any) => e[col] === val) as any;
            if (!entry) return { data: null, error: { message: 'Not found' } };
            Object.assign(entry, updates);
            return { data: entry, error: null };
          },
        }),
      }),
    }),
    delete: () => ({
      eq: (col: string, val: string) => ({
        then: async (cb: any) => {
          console.log(`MOCK delete from ${tableName}:`, { eq: { [col]: val } });
          const key = Object.keys(mockWaterEntries).find((k) => mockWaterEntries[k][col] === val);
          if (key) delete mockWaterEntries[key];
          cb({ error: null });
          return { error: null };
        },
        catch: () => ({ error: null }),
      }),
    }),
    upsert: async (record: any) => {
      console.log(`MOCK upsert into ${tableName}:`, record);
      mockUsers[record.id] = { ...mockUsers[record.id], ...record };
      return { data: record, error: null };
    },
  }),
};
