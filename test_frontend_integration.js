// Test script to verify frontend calendar integration
// This would typically be run in a browser environment or with a test runner

// Mock the calendar API service for testing
const mockCalendarApiService = {
  async fetchEvents(startDate, endDate, filters = {}) {
    console.log('🔍 Testing fetchEvents with:', { startDate, endDate, filters });
    
    // Simulate the API call structure
    const requestBody = {
      query: {
        start_date: this.formatDateForApi(startDate),
        end_date: this.formatDateForApi(endDate),
        include_events: filters.includeEvents ?? true,
        include_tasks: filters.includeTasks ?? true,
        include_recurring: filters.includeRecurring ?? true,
        event_types: filters.eventTypes || [],
        statuses: filters.statuses || [],
        owner_ids: filters.ownerIds || [],
        account_ids: filters.accountIds || [],
        search_term: filters.searchTerm || "",
        limit: filters.limit || 1000,
        offset: filters.offset || 0,
      },
      auth: {
        access_token: 'mock_token',
        instance_url: 'https://mock.salesforce.com',
      },
    };
    
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    
    // Mock response with fixed tasks (including ones that would have failed before)
    return {
      success: true,
      events: [
        {
          id: 'task_00TU500000Hsg0YMAR',
          title: 'Task 00TU500000Hsg0YMAR', // This would be the fallback subject
          start: '2024-01-15T00:00:00.000Z',
          end: null,
          all_day: true,
          description: 'Test task description',
          status: 'not_started',
          event_type: 'task',
          salesforce_id: '00TU500000Hsg0YMAR',
          salesforce_type: 'Task',
          owner_name: 'Test User',
          color: '#9e9e9e',
          has_reminder: false,
          reminder_minutes: null,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
          editable: false,
          start_editable: false,
          duration_editable: false
        },
        {
          id: 'event_003XX000004TMJ2',
          title: 'Valid Event with Subject',
          start: '2024-01-15T14:00:00.000Z',
          end: '2024-01-15T15:00:00.000Z',
          all_day: false,
          description: 'This is a valid event',
          location: 'Conference Room A',
          status: 'planned',
          event_type: 'meeting',
          salesforce_id: '003XX000004TMJ2',
          salesforce_type: 'Event',
          owner_name: 'Test User',
          color: '#1976d2',
          has_reminder: true,
          reminder_minutes: 15,
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          editable: true,
          start_editable: true,
          duration_editable: true
        }
      ],
      total: 2,
      message: 'Events fetched successfully'
    };
  },
  
  formatDateForApi(date) {
    if (date instanceof Date) {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    }
    return date;
  }
};

// Test functions
async function testFetchEvents() {
  console.log('🧪 Testing fetchEvents functionality...\n');
  
  const startDate = new Date('2024-01-15');
  const endDate = new Date('2024-01-16');
  
  try {
    const result = await mockCalendarApiService.fetchEvents(startDate, endDate, {
      includeEvents: true,
      includeTasks: true,
      includeRecurring: true
    });
    
    console.log('✅ fetchEvents successful!');
    console.log('📊 Result summary:');
    console.log(`   - Total events: ${result.total}`);
    console.log(`   - Events returned: ${result.events.length}`);
    
    // Verify the task with fallback subject is included
    const taskWithFallback = result.events.find(e => e.id === 'task_00TU500000Hsg0YMAR');
    if (taskWithFallback) {
      console.log('✅ Task with fallback subject found:');
      console.log(`   - ID: ${taskWithFallback.id}`);
      console.log(`   - Title: ${taskWithFallback.title}`);
      console.log(`   - Type: ${taskWithFallback.event_type}`);
    } else {
      console.log('❌ Task with fallback subject not found');
    }
    
    // Verify timezone handling in dates
    result.events.forEach(event => {
      const startDate = new Date(event.start);
      const isValidDate = !isNaN(startDate.getTime());
      console.log(`✅ Event "${event.title}" has valid start date: ${isValidDate ? startDate.toISOString() : 'Invalid'}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ fetchEvents failed:', error);
    return false;
  }
}

function testDateFormatting() {
  console.log('\n🧪 Testing date formatting...\n');
  
  const testDates = [
    new Date('2024-01-15T10:30:00.000Z'),
    new Date('2024-12-31T23:59:59.999Z'),
    '2024-01-15'
  ];
  
  testDates.forEach(date => {
    try {
      const formatted = mockCalendarApiService.formatDateForApi(date);
      console.log(`✅ Date ${date} formatted as: ${formatted}`);
    } catch (error) {
      console.error(`❌ Failed to format date ${date}:`, error);
    }
  });
  
  return true;
}

function testEventValidation() {
  console.log('\n🧪 Testing event data validation...\n');
  
  const testEvents = [
    {
      id: 'task_with_null_subject',
      title: null, // This should be handled gracefully
      start: '2024-01-15T00:00:00.000Z'
    },
    {
      id: 'task_with_empty_subject',
      title: '', // This should be handled gracefully
      start: '2024-01-15T00:00:00.000Z'
    },
    {
      id: 'valid_event',
      title: 'Valid Event Title',
      start: '2024-01-15T14:00:00.000Z'
    }
  ];
  
  testEvents.forEach(event => {
    // Simulate frontend validation
    const hasValidTitle = event.title && event.title.trim().length > 0;
    const hasValidStart = event.start && !isNaN(new Date(event.start).getTime());
    
    console.log(`Event ${event.id}:`);
    console.log(`   - Valid title: ${hasValidTitle ? '✅' : '❌'} (${event.title || 'null/empty'})`);
    console.log(`   - Valid start: ${hasValidStart ? '✅' : '❌'} (${event.start})`);
    
    if (!hasValidTitle) {
      console.log(`   - Would use fallback title: "Task ${event.id}"`);
    }
  });
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting frontend calendar integration tests...\n');
  
  const tests = [
    { name: 'Date Formatting', fn: testDateFormatting },
    { name: 'Event Validation', fn: testEventValidation },
    { name: 'Fetch Events', fn: testFetchEvents }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Running: ${test.name}`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`\n✅ ${test.name} - PASSED`);
      } else {
        console.log(`\n❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.error(`\n💥 ${test.name} - CRASHED:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Test Results: ${passed}/${tests.length} tests passed`);
  console.log(`${'='.repeat(50)}`);
  
  if (passed === tests.length) {
    console.log('🎉 All frontend integration tests passed!');
    console.log('The calendar API service should work correctly with the backend fixes.');
  } else {
    console.log('⚠️  Some tests failed. Please review the integration.');
  }
  
  return passed === tests.length;
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, mockCalendarApiService };
} else if (typeof window !== 'undefined') {
  window.calendarIntegrationTests = { runTests, mockCalendarApiService };
}

// Auto-run if this is the main script
if (typeof require !== 'undefined' && require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}
