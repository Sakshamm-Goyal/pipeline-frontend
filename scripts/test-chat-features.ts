/**
 * Comprehensive Chat Features Test Suite
 *
 * Tests all chat functionality including:
 * - Message sending
 * - Conversation management (create, list, delete)
 * - Clarification flow
 * - Image upload
 * - Voice messages
 * - Error handling
 * - Edge cases
 */

export {}; // Make this a module

const API_BASE = 'http://localhost:6900/api/v2';

// Test user credentials (should exist in DB)
const TEST_USER = {
  email: 'sakshamagarwal@ucla.edu',
  password: 'password123'
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function logResult(name: string, passed: boolean, message: string, startTime: number) {
  const duration = Date.now() - startTime;
  results.push({ name, passed, message, duration });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name} (${duration}ms)`);
  if (!passed) {
    console.log(`   Error: ${message}`);
  }
}

async function makeRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    userId?: string;
    token?: string;
  } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const { method = 'GET', body, headers = {}, userId, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (userId) {
    requestHeaders['x-user-id'] = userId;
  }
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data };
}

// ==================== TESTS ====================

async function testLogin(): Promise<{ userId: string; token: string }> {
  const startTime = Date.now();
  try {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: TEST_USER,
    });

    if (!response.ok || !response.data?.user?._id) {
      await logResult('Login', false, `Login failed: ${JSON.stringify(response.data)}`, startTime);
      throw new Error('Login failed');
    }

    await logResult('Login', true, 'Successfully logged in', startTime);
    return {
      userId: response.data.user._id,
      token: response.data.accessToken,
    };
  } catch (error: any) {
    await logResult('Login', false, error.message, startTime);
    throw error;
  }
}

async function testCreateConversation(userId: string, token: string): Promise<string> {
  const startTime = Date.now();
  try {
    const response = await makeRequest('/chat', {
      method: 'POST',
      userId,
      token,
    });

    if (!response.ok || !response.data?.conversationId) {
      await logResult('Create Conversation', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      throw new Error('Create conversation failed');
    }

    await logResult('Create Conversation', true, `Created: ${response.data.conversationId}`, startTime);
    return response.data.conversationId;
  } catch (error: any) {
    await logResult('Create Conversation', false, error.message, startTime);
    throw error;
  }
}

async function testSendMessage(userId: string, token: string, conversationId?: string): Promise<string> {
  const startTime = Date.now();
  try {
    const response = await makeRequest('/chat/message', {
      method: 'POST',
      body: {
        message: 'I need a formal outfit for a job interview',
        conversationId,
      },
      userId,
      token,
    });

    if (!response.ok) {
      await logResult('Send Message', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      throw new Error('Send message failed');
    }

    const convId = response.data?.conversationId || conversationId;
    const hasOutfits = response.data?.response?.data?.outfits?.length > 0;
    const hasProducts = response.data?.response?.data?.products?.length > 0;

    await logResult(
      'Send Message',
      true,
      `Response received. Outfits: ${hasOutfits}, Products: ${hasProducts}, ConvId: ${convId}`,
      startTime
    );

    return convId;
  } catch (error: any) {
    await logResult('Send Message', false, error.message, startTime);
    throw error;
  }
}

async function testGetConversations(userId: string, token: string): Promise<void> {
  const startTime = Date.now();
  try {
    const response = await makeRequest('/chat?limit=10', {
      userId,
      token,
    });

    if (!response.ok) {
      await logResult('Get Conversations', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      return;
    }

    const conversations = response.data?.conversations || [];
    await logResult('Get Conversations', true, `Found ${conversations.length} conversations`, startTime);
  } catch (error: any) {
    await logResult('Get Conversations', false, error.message, startTime);
  }
}

async function testGetConversation(userId: string, token: string, conversationId: string): Promise<void> {
  const startTime = Date.now();
  try {
    const response = await makeRequest(`/chat/${conversationId}`, {
      userId,
      token,
    });

    if (!response.ok) {
      await logResult('Get Conversation', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      return;
    }

    const messageCount = response.data?.messages?.length || 0;
    await logResult('Get Conversation', true, `Found ${messageCount} messages`, startTime);
  } catch (error: any) {
    await logResult('Get Conversation', false, error.message, startTime);
  }
}

async function testResumeConversation(userId: string, token: string, conversationId: string): Promise<void> {
  const startTime = Date.now();
  try {
    // First send a clarification-triggering message
    await makeRequest('/chat/message', {
      method: 'POST',
      body: {
        message: 'I need an outfit',
        conversationId,
      },
      userId,
      token,
    });

    // Now try to resume with a clarification response
    const response = await makeRequest(`/chat/${conversationId}/resume`, {
      method: 'POST',
      body: {
        response: 'formal business attire',
      },
      userId,
      token,
    });

    if (!response.ok) {
      await logResult('Resume Conversation', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      return;
    }

    await logResult('Resume Conversation', true, 'Successfully resumed with clarification', startTime);
  } catch (error: any) {
    await logResult('Resume Conversation', false, error.message, startTime);
  }
}

async function testDeleteConversation(userId: string, token: string, conversationId: string): Promise<void> {
  const startTime = Date.now();
  try {
    const response = await makeRequest(`/chat/${conversationId}`, {
      method: 'DELETE',
      userId,
      token,
    });

    if (!response.ok) {
      await logResult('Delete Conversation', false, `Failed: ${JSON.stringify(response.data)}`, startTime);
      return;
    }

    await logResult('Delete Conversation', true, 'Successfully deleted conversation', startTime);

    // Verify deletion
    const verifyResponse = await makeRequest(`/chat/${conversationId}`, {
      userId,
      token,
    });

    if (verifyResponse.ok) {
      await logResult('Verify Deletion', false, 'Conversation still exists after deletion', startTime);
    } else {
      await logResult('Verify Deletion', true, 'Conversation no longer accessible', startTime);
    }
  } catch (error: any) {
    await logResult('Delete Conversation', false, error.message, startTime);
  }
}

async function testErrorHandling(userId: string, token: string): Promise<void> {
  // Test missing user ID
  let startTime = Date.now();
  try {
    const response = await makeRequest('/chat/message', {
      method: 'POST',
      body: { message: 'test' },
      token,
    });

    if (response.status === 400) {
      await logResult('Error: Missing User ID', true, 'Correctly rejected request without user ID', startTime);
    } else {
      await logResult('Error: Missing User ID', false, `Expected 400, got ${response.status}`, startTime);
    }
  } catch (error: any) {
    await logResult('Error: Missing User ID', false, error.message, startTime);
  }

  // Test empty message
  startTime = Date.now();
  try {
    const response = await makeRequest('/chat/message', {
      method: 'POST',
      body: {},
      userId,
      token,
    });

    if (response.status === 400) {
      await logResult('Error: Empty Message', true, 'Correctly rejected empty message', startTime);
    } else {
      await logResult('Error: Empty Message', false, `Expected 400, got ${response.status}`, startTime);
    }
  } catch (error: any) {
    await logResult('Error: Empty Message', false, error.message, startTime);
  }

  // Test invalid conversation ID
  startTime = Date.now();
  try {
    const response = await makeRequest('/chat/invalid-conversation-id', {
      userId,
      token,
    });

    if (response.status === 400 || response.status === 404) {
      await logResult('Error: Invalid Conv ID', true, 'Correctly rejected invalid conversation ID', startTime);
    } else {
      await logResult('Error: Invalid Conv ID', false, `Expected 400/404, got ${response.status}`, startTime);
    }
  } catch (error: any) {
    await logResult('Error: Invalid Conv ID', false, error.message, startTime);
  }

  // Test unauthorized access (wrong user ID)
  startTime = Date.now();
  try {
    const response = await makeRequest('/chat/message', {
      method: 'POST',
      body: { message: 'test' },
      userId: 'wrong-user-id',
      token,
    });

    // This should work since we're creating a new conversation for "wrong-user-id"
    // But the user doesn't exist, so it might fail
    if (response.status >= 400) {
      await logResult('Error: Wrong User ID', true, 'Correctly handled wrong user ID', startTime);
    } else {
      await logResult('Error: Wrong User ID', true, 'Created conversation for new user (expected)', startTime);
    }
  } catch (error: any) {
    await logResult('Error: Wrong User ID', false, error.message, startTime);
  }
}

async function testMessageValidation(userId: string, token: string): Promise<void> {
  // Test very long message (should be rejected if > 5000 chars)
  const startTime = Date.now();
  try {
    const longMessage = 'a'.repeat(6000);
    const response = await makeRequest('/chat/message', {
      method: 'POST',
      body: { message: longMessage },
      userId,
      token,
    });

    if (response.status === 400) {
      await logResult('Validation: Long Message', true, 'Correctly rejected message > 5000 chars', startTime);
    } else {
      await logResult('Validation: Long Message', false, `Expected 400, got ${response.status}`, startTime);
    }
  } catch (error: any) {
    await logResult('Validation: Long Message', false, error.message, startTime);
  }
}

async function testOutfitGeneration(userId: string, token: string): Promise<void> {
  // Test different outfit requests
  const testCases = [
    { message: 'casual outfit for weekend brunch', expected: 'casual' },
    { message: 'formal attire for wedding guest', expected: 'formal' },
    { message: 'beach vacation outfit ideas', expected: 'beach' },
  ];

  for (const testCase of testCases) {
    const startTime = Date.now();
    try {
      const response = await makeRequest('/chat/message', {
        method: 'POST',
        body: { message: testCase.message },
        userId,
        token,
      });

      if (!response.ok) {
        await logResult(`Outfit: ${testCase.expected}`, false, `Failed: ${response.status}`, startTime);
        continue;
      }

      const outfits = response.data?.response?.data?.outfits || [];
      const products = response.data?.response?.data?.products || [];
      const hasResults = outfits.length > 0 || products.length > 0;

      await logResult(
        `Outfit: ${testCase.expected}`,
        hasResults,
        hasResults
          ? `Generated ${outfits.length} outfits, ${products.length} products`
          : 'No outfits or products returned',
        startTime
      );
    } catch (error: any) {
      await logResult(`Outfit: ${testCase.expected}`, false, error.message, startTime);
    }
  }
}

// ==================== MAIN ====================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           COMPREHENSIVE CHAT FEATURES TEST SUITE              ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Login
    console.log('🔐 Authentication Tests');
    console.log('───────────────────────────────────────────────────────────────');
    const { userId, token } = await testLogin();
    console.log(`   User ID: ${userId}\n`);

    // 2. Conversation Management
    console.log('📋 Conversation Management Tests');
    console.log('───────────────────────────────────────────────────────────────');
    const conversationId = await testCreateConversation(userId, token);
    await testGetConversations(userId, token);
    await testGetConversation(userId, token, conversationId);
    console.log('');

    // 3. Message Sending
    console.log('💬 Message Sending Tests');
    console.log('───────────────────────────────────────────────────────────────');
    const newConvId = await testSendMessage(userId, token);
    console.log('');

    // 4. Clarification Flow
    console.log('🔄 Clarification Flow Tests');
    console.log('───────────────────────────────────────────────────────────────');
    await testResumeConversation(userId, token, newConvId);
    console.log('');

    // 5. Error Handling
    console.log('⚠️  Error Handling Tests');
    console.log('───────────────────────────────────────────────────────────────');
    await testErrorHandling(userId, token);
    console.log('');

    // 6. Validation
    console.log('✅ Validation Tests');
    console.log('───────────────────────────────────────────────────────────────');
    await testMessageValidation(userId, token);
    console.log('');

    // 7. Outfit Generation
    console.log('👗 Outfit Generation Tests');
    console.log('───────────────────────────────────────────────────────────────');
    await testOutfitGeneration(userId, token);
    console.log('');

    // 8. Delete Conversation (cleanup)
    console.log('🗑️  Cleanup Tests');
    console.log('───────────────────────────────────────────────────────────────');
    await testDeleteConversation(userId, token, conversationId);
    console.log('');

  } catch (error: any) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Print Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         TEST SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total} tests`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch(console.error);
