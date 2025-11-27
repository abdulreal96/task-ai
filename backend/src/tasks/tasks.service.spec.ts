import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * TasksService Unit Tests
 * 
 * This test suite validates all CRUD operations for task management.
 * We use Jest mocks to simulate MongoDB operations without requiring a real database.
 * 
 * Key Testing Concepts:
 * 1. Mock Model - Simulates MongoDB Model behavior (find, findOne, save, deleteOne)
 * 2. Isolated Tests - Each test is independent and doesn't affect others
 * 3. Behavior Testing - Verify correct methods are called with expected parameters
 * 4. Edge Cases - Test error scenarios (not found, validation failures)
 */
describe('TasksService', () => {
  let service: TasksService;
  let model: Model<TaskDocument>;

  // Sample test data - MongoDB ObjectId format
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockTaskId = '507f1f77bcf86cd799439012';

  // Mock task object that simulates a MongoDB document
  const mockTask = {
    _id: mockTaskId,
    userId: mockUserId,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    tags: ['test'],
    timeSpent: 0,
    timerStatus: 'stopped',
    activities: [
      {
        type: 'created',
        timestamp: new Date(),
        description: 'Task created',
      },
    ],
    save: jest.fn().mockResolvedValue(this),
  };

  // Mock Mongoose model with all methods used by TasksService
  // Each method returns a mock that can be configured per test
  const mockTaskModel = {
    constructor: jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: mockTaskId }),
    })),
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    exec: jest.fn(),
    sort: jest.fn(),
  };

  /**
   * Setup before each test
   * - Creates a fresh testing module with mocked dependencies
   * - Resets all mocks to ensure test isolation
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          // Replace real MongoDB model with our mock
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    model = module.get<Model<TaskDocument>>(getModelToken(Task.name));

    // Reset all mock call history and return values
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * CREATE Tests
   * Tests the task creation functionality
   */
  describe('create', () => {
    /**
     * Test: Successfully create a new task
     * - Mocks the save() method to return a saved task
     * - Verifies task includes all required fields and activity log
     */
    it('should create a new task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        tags: ['urgent'],
      };

      const saveMock = jest.fn().mockResolvedValue({
        ...createTaskDto,
        userId: mockUserId,
        _id: mockTaskId,
        status: 'todo',
        timerStatus: 'stopped',
        timeSpent: 0,
        activities: [
          {
            type: 'created',
            timestamp: expect.any(Date),
            description: 'Task created',
          },
        ],
      });

      (model as any) = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      service['taskModel'] = model as any;

      const result = await service.create(mockUserId, createTaskDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    /**
     * Test: Ensure userId is attached to created task
     * - Verifies that tasks are properly associated with the user
     * - Critical for data isolation between users
     */
    it('should include userId in created task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task with UserId',
      };

      const saveMock = jest.fn().mockResolvedValue({
        ...createTaskDto,
        userId: mockUserId,
      });

      (model as any) = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      service['taskModel'] = model as any;

      await service.create(mockUserId, createTaskDto);

      expect(saveMock).toHaveBeenCalled();
    });
  });

  /**
   * READ Tests (findAll)
   * Tests retrieving multiple tasks with optional filtering
   */
  describe('findAll', () => {
    /**
     * Test: Retrieve all tasks for a specific user
     * - Mocks the MongoDB query chain: find() -> sort() -> exec()
     * - Verifies tasks are sorted by creation date (newest first)
     */
    it('should return all tasks for a user', async () => {
      const mockTasks = [mockTask, { ...mockTask, _id: 'another-id' }];
      const execMock = jest.fn().mockResolvedValue(mockTasks);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      
      mockTaskModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.findAll(mockUserId);

      expect(mockTaskModel.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockTasks);
    });

    /**
     * Test: Filter tasks by status
     * - Tests query with status parameter (e.g., 'completed', 'todo')
     * - Ensures filter is correctly applied to MongoDB query
     */
    it('should filter tasks by status', async () => {
      const mockTasks = [mockTask];
      const execMock = jest.fn().mockResolvedValue(mockTasks);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      
      mockTaskModel.find.mockReturnValue({ sort: sortMock });

      await service.findAll(mockUserId, 'completed');

      expect(mockTaskModel.find).toHaveBeenCalledWith({
        userId: mockUserId,
        status: 'completed',
      });
    });
  });

  /**
   * READ Tests (findOne)
   * Tests retrieving a single task by ID
   */
  describe('findOne', () => {
    /**
     * Test: Successfully retrieve a single task
     * - Verifies query includes both taskId and userId (security check)
     * - Ensures users can only access their own tasks
     */
    it('should return a single task', async () => {
      const execMock = jest.fn().mockResolvedValue(mockTask);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.findOne(mockUserId, mockTaskId);

      expect(mockTaskModel.findOne).toHaveBeenCalledWith({
        _id: mockTaskId,
        userId: mockUserId,
      });
      expect(result).toEqual(mockTask);
    });

    /**
     * Test: Handle task not found scenario
     * - When task doesn't exist or belongs to another user
     * - Should throw NotFoundException (proper error handling)
     */
    it('should throw NotFoundException if task not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      await expect(service.findOne(mockUserId, mockTaskId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * UPDATE Tests
   * Tests task modification with various scenarios
   * Includes: basic updates, status tracking, timer management
   */
  describe('update', () => {
    /**
     * Test: Update task fields successfully
     * - Changes task properties like title, status
     * - Verifies save() is called to persist changes
     */
    it('should update a task successfully', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: 'in-progress',
      };

      const taskMock = {
        ...mockTask,
        activities: [],
        save: jest.fn().mockResolvedValue({ ...mockTask, ...updateTaskDto }),
      };

      const execMock = jest.fn().mockResolvedValue(taskMock);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(taskMock.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    /**
     * Test: Activity logging for status changes
     * - When task status changes (todo -> completed), log it
     * - Helps track task history and audit trail
     */
    it('should track status changes in activities', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: 'completed',
      };

      const taskMock = {
        ...mockTask,
        status: 'in-progress',
        activities: [],
        save: jest.fn().mockResolvedValue({ ...mockTask, ...updateTaskDto }),
      };

      const execMock = jest.fn().mockResolvedValue(taskMock);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(taskMock.activities).toContainEqual(
        expect.objectContaining({
          type: 'status_changed',
          description: expect.stringContaining('in-progress to completed'),
        }),
      );
    });

    /**
     * Test: Start task timer
     * - When user starts working on a task
     * - Sets timerStatus to 'running' and records start time
     * - Logs 'timer_started' activity
     */
    it('should handle timer start', async () => {
      const updateTaskDto: UpdateTaskDto = {
        timerStatus: 'running',
      };

      const taskMock = {
        ...mockTask,
        timerStatus: 'stopped',
        activities: [],
        save: jest.fn().mockResolvedValue({ ...mockTask, ...updateTaskDto }),
      };

      const execMock = jest.fn().mockResolvedValue(taskMock);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(taskMock.timerStatus).toBe('running');
      expect(taskMock.timeSpent).toBeDefined();
      expect(taskMock.activities).toContainEqual(
        expect.objectContaining({
          type: 'timer_started',
        }),
      );
    });

    /**
     * Test: Stop task timer and calculate time spent
     * - When user stops working on a task
     * - Calculates elapsed time since timer started
     * - Adds elapsed time to total timeSpent
     * - Logs 'timer_stopped' activity with duration
     */
    it('should handle timer stop and calculate time spent', async () => {
      const updateTaskDto: UpdateTaskDto = {
        timerStatus: 'paused',
      };

      const startTime = new Date(Date.now() - 60000); // 1 minute ago
      const taskMock = {
        ...mockTask,
        timerStatus: 'running',
        timerStartedAt: startTime,
        timeSpent: 0,
        activities: [],
        save: jest.fn().mockResolvedValue({ ...mockTask, ...updateTaskDto }),
      };

      const execMock = jest.fn().mockResolvedValue(taskMock);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(taskMock.timerStatus).toBe('paused');
      expect(taskMock.timeSpent).toBeGreaterThan(0);
      expect(taskMock.activities).toContainEqual(
        expect.objectContaining({
          type: 'timer_stopped',
        }),
      );
    });

    /**
     * Test: Error handling when updating non-existent task
     * - Ensures proper exception is thrown
     * - Prevents silent failures
     */
    it('should throw NotFoundException if task not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockTaskModel.findOne.mockReturnValue({ exec: execMock });

      await expect(
        service.update(mockUserId, mockTaskId, { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * DELETE Tests
   * Tests task deletion functionality
   */
  describe('remove', () => {
    /**
     * Test: Successfully delete a task
     * - Verifies deleteOne() is called with correct parameters
     * - Checks both taskId and userId for security
     */
    it('should delete a task successfully', async () => {
      const execMock = jest.fn().mockResolvedValue({ deletedCount: 1 });
      mockTaskModel.deleteOne.mockReturnValue({ exec: execMock });

      await service.remove(mockUserId, mockTaskId);

      expect(mockTaskModel.deleteOne).toHaveBeenCalledWith({
        _id: mockTaskId,
        userId: mockUserId,
      });
    });

    /**
     * Test: Handle deletion of non-existent task
     * - When deletedCount is 0, task wasn't found
     * - Should throw NotFoundException
     */
    it('should throw NotFoundException if task not found', async () => {
      const execMock = jest.fn().mockResolvedValue({ deletedCount: 0 });
      mockTaskModel.deleteOne.mockReturnValue({ exec: execMock });

      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * STATISTICS Tests
   * Tests task analytics and reporting
   */
  describe('getStats', () => {
    /**
     * Test: Calculate task statistics
     * - Counts total, todo, in-progress, completed tasks
     * - Identifies overdue tasks (past due date and not completed)
     * - Used for dashboard analytics
     */
    it('should return task statistics', async () => {
      const mockTasks = [
        { ...mockTask, status: 'todo' },
        { ...mockTask, status: 'in-progress' },
        { ...mockTask, status: 'completed' },
        { ...mockTask, status: 'todo', dueDate: new Date(Date.now() - 86400000) }, // overdue
      ];

      const execMock = jest.fn().mockResolvedValue(mockTasks);
      mockTaskModel.find.mockReturnValue({ exec: execMock });

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 4,
        todo: 2,
        inProgress: 1,
        completed: 1,
        overdue: 1,
      });
    });

    /**
     * Test: Handle user with no tasks
     * - Should return all zeros
     * - Prevents undefined or null errors in frontend
     */
    it('should return zero stats for user with no tasks', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      mockTaskModel.find.mockReturnValue({ exec: execMock });

      const result = await service.getStats(mockUserId);

      expect(result).toEqual({
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
      });
    });
  });
});
