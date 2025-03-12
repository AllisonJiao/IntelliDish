// Set timeout for all tests
jest.setTimeout(30000);

// Reset all mocks before each test
beforeEach(() => {
    jest.resetAllMocks();
});

// Ensure we catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up after all tests
afterAll(async () => {
    // Add a small delay to allow any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
}); 