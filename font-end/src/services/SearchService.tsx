import { apiCall } from "../configs/axios";

export interface SearchResource {
    id: string;
    name: string;
    version?: string;
    url?: string;
    created_at?: string;
}

export interface SearchUser {
    id: string;
    name: string;
    email?: string;
    role?: string;
}

export interface SearchResults {
    resources: SearchResource[];
    users: SearchUser[];
}

export const SearchService = {
    async searchResources(query: string): Promise<SearchResource[]> {
        try {
            const response = await apiCall.get('/resource-management/resources/', {
                params: {
                    name: query
                }
            });
            
            if (response.data && response.data.code === 'BE0000') {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error searching resources:', error);
            return [];
        }
    },

    async searchUsers(query: string): Promise<SearchUser[]> {
        try {
            const response = await apiCall.get('/resource-management/users', {
                params: {
                    page: 1,
                    page_size: 10
                }
            });
            
            if (response.data && response.data.code === 'BE0000') {
                const users = response.data.data?.users || response.data.data || [];
                // Filter users by query (name or email)
                const filteredUsers = users.filter((user: any) => 
                    user.name?.toLowerCase().includes(query.toLowerCase()) ||
                    user.email?.toLowerCase().includes(query.toLowerCase())
                );
                return filteredUsers.slice(0, 5); // Limit to 5 results
            }
            return [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    },

    async searchAll(query: string): Promise<SearchResults> {
        if (!query || query.trim().length < 2) {
            return { resources: [], users: [] };
        }

        try {
            const [resources, users] = await Promise.all([
                this.searchResources(query),
                this.searchUsers(query)
            ]);

            return { resources, users };
        } catch (error) {
            console.error('Error in searchAll:', error);
            return { resources: [], users: [] };
        }
    }
};

