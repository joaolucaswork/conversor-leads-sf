// Simple test script to verify API connection
const axios = require('axios');

async function testApiConnection() {
    console.log('Testing API connection...');
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get('http://localhost:8000/api/v1/health');
        console.log('✅ Health check successful:', healthResponse.data);
        
        // Test history endpoint with auth token
        console.log('2. Testing history endpoint...');
        const historyResponse = await axios.get('http://localhost:8000/api/v1/leads/history?page=1&limit=10', {
            headers: {
                'Authorization': 'Bearer test-token-123'
            }
        });
        console.log('✅ History endpoint successful:', historyResponse.data);
        
        console.log('\n🎉 All API tests passed! The backend is working correctly.');
        
    } catch (error) {
        console.error('❌ API test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testApiConnection();
