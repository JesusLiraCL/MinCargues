// Mock implementation of the database module
const mockQuery = jest.fn();

const mockDatabase = {
    query: mockQuery
};

// Reset the mock before each test
beforeEach(() => {
    mockQuery.mockReset();
});

module.exports = mockDatabase;
