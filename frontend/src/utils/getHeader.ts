export const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};