import { useState, useEffect } from 'react';
import { Task } from '../App';
import { Mic, X, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion } from 'motion/react';

type RecordTaskProps = {
  onTaskCreated: (task: Task) => void;
  onBack: () => void;
};

export function RecordTask({ onTaskCreated, onBack }: RecordTaskProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Simulate recording with animation
  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (transcript.trim()) {
      processTranscript();
    }
  };

  // Simulate AI processing
  const processTranscript = () => {
    setIsProcessing(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Mock AI extraction
      const tasks = extractTasksFromTranscript(transcript);
      setExtractedTasks(tasks);
      setIsProcessing(false);
      setShowConfirmation(true);
    }, 2000);
  };

  // Mock AI extraction logic
  const extractTasksFromTranscript = (text: string): any[] => {
    const mockTasks = [
      {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        tags: extractTags(text)
      }
    ];
    
    return mockTasks;
  };

  const extractTags = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const tags: string[] = [];
    
    const tagMap: { [key: string]: string } = {
      'implement': 'implement',
      'fix': 'fix',
      'bug': 'bug',
      'design': 'design',
      'wallet': 'wallet',
      'auth': 'authentication',
      'login': 'authentication',
      'dashboard': 'dashboard',
      'api': 'api',
      'database': 'database'
    };
    
    Object.keys(tagMap).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        if (!tags.includes(tagMap[keyword])) {
          tags.push(tagMap[keyword]);
        }
      }
    });
    
    return tags.length > 0 ? tags : ['general'];
  };

  const confirmTasks = () => {
    extractedTasks.forEach(taskData => {
      const newTask: Task = {
        id: Date.now().toString() + Math.random(),
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
        status: 'todo',
        timeLogged: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        activities: [
          {
            id: `a${Date.now()}`,
            type: 'created',
            description: 'Task created via voice',
            timestamp: new Date()
          }
        ]
      };
      onTaskCreated(newTask);
    });
    
    // Reset and go back
    setTranscript('');
    setExtractedTasks([]);
    setShowConfirmation(false);
    onBack();
  };

  // Simulate live transcription
  useEffect(() => {
    if (isRecording) {
      const phrases = [
        'I need to implement the wallet balance feature for the transporter module',
        'Fix the authentication bug on mobile devices',
        'Design a new user dashboard with analytics'
      ];
      
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex < randomPhrase.length) {
          setTranscript(randomPhrase.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        <h1 className="text-xl">Record Task</h1>
        <div className="w-10" />
      </div>

      {/* Recording Area */}
      <div className="flex flex-col items-center justify-center px-6 pt-12">
        {!isProcessing && !showConfirmation && (
          <>
            {/* Microphone Button */}
            <motion.div
              className="relative mb-12"
              animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5 }}
            >
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 shadow-2xl' 
                    : 'bg-white text-blue-600 shadow-xl'
                }`}
              >
                <Mic className="w-16 h-16" />
              </button>
              
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white/30"
                  animate={{ scale: [1, 1.5, 1.5], opacity: [1, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.div>

            {/* Waveform Animation */}
            {isRecording && (
              <div className="flex items-center gap-1 mb-8">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [10, Math.random() * 40 + 10, 10]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: i * 0.05
                    }}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <p className="text-center text-xl mb-4">
              {isRecording ? 'Listening...' : 'Tap to speak'}
            </p>
            <p className="text-center text-blue-200 text-sm max-w-xs">
              {isRecording 
                ? 'Speak naturally about your tasks' 
                : 'Tell me what you need to do and I\'ll organize it for you'
              }
            </p>

            {/* Live Transcript */}
            {transcript && (
              <Card className="mt-8 p-4 bg-white/10 backdrop-blur-sm border-white/20 max-w-sm">
                <p className="text-sm">{transcript}</p>
              </Card>
            )}

            {/* Finish Button */}
            {transcript && !isRecording && (
              <Button
                onClick={processTranscript}
                className="mt-8 bg-white text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                Process Task
              </Button>
            )}
          </>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
            <p className="text-xl mb-2">Processing with AI...</p>
            <p className="text-blue-200 text-sm">Extracting tasks and tags</p>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="p-6 bg-white text-gray-900">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl">I found {extractedTasks.length} task{extractedTasks.length !== 1 ? 's' : ''}</h2>
              </div>

              {extractedTasks.map((task, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2">{task.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false);
                    setTranscript('');
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={confirmTasks}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Confirm
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
