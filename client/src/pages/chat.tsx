import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { MessageCircle, Send, Plus, Bot, User, Sparkles, Wand2, ArrowLeft, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/conversations', { title: t('newConversation') || 'New Conversation' });
      return await response.json();
    },
    onSuccess: (newConversation: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(newConversation.id);
      inputRef.current?.focus();
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToCreateConversation') || 'Failed to create conversation',
        variant: 'destructive',
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!selectedConversation) throw new Error('No conversation selected');
      
      const response = await apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, { content, language });
      return await response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] }); // Update conversation list with new title
      setMessage("");
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: t('error'),
        description: t('failedToSendMessage') || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    if (!selectedConversation) {
      // Create new conversation first
      createConversationMutation.mutate();
      return;
    }
    
    sendMessageMutation.mutate({ content: message.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        {/* Header with navigation and playful animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft size={16} />
                  <Home size={16} />
                  <span>{t('backToHome') || 'Back to Home'}</span>
                </Button>
              </motion.div>
            </Link>
          </div>
          
          {/* Chat Title */}
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center gap-3 mb-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Bot className="text-primary text-4xl" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {t('aiCareerMentor') || 'AI Career Mentor'}
                </h1>
                <motion.div 
                  className="flex items-center justify-center gap-1 text-primary"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={16} />
                  <span className="text-sm">{t('yourPersonalCareerGuide') || 'Your Personal Career Guide'}</span>
                  <Sparkles size={16} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Conversations Sidebar */}
          <Card className="w-80 flex flex-col">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageCircle className="text-primary" size={20} />
                  {t('conversations') || 'Conversations'}
                </h3>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="sm"
                    onClick={() => createConversationMutation.mutate()}
                    disabled={createConversationMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus size={16} />
                  </Button>
                </motion.div>
              </div>
              
              <ScrollArea className="flex-1">
                <AnimatePresence>
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={selectedConversation === conversation.id ? "default" : "ghost"}
                        className={`w-full justify-start mb-2 h-auto p-3 ${
                          selectedConversation === conversation.id 
                            ? 'bg-primary text-white' 
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="text-left truncate">
                          <div className="font-medium truncate">{conversation.title}</div>
                          <div className="text-xs opacity-70 truncate">
                            {new Date(conversation.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {conversations.length === 0 && !conversationsLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-500 py-8"
                  >
                    <Bot className="mx-auto mb-2 text-gray-300" size={48} />
                    <p className="mb-4">{t('noConversationsYet') || 'No conversations yet'}</p>
                    <Button
                      onClick={() => createConversationMutation.mutate()}
                      disabled={createConversationMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="mr-2" size={16} />
                      {t('startChatting') || 'Start Chatting'}
                    </Button>
                  </motion.div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                msg.role === 'user' 
                                  ? 'bg-primary text-white' 
                                  : 'bg-orange-100 text-primary dark:bg-orange-900 dark:text-orange-300'
                              }`}
                            >
                              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={`rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div className={`text-xs mt-1 opacity-70`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing indicator */}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="mb-4 flex justify-start"
                        >
                          <div className="flex items-start gap-3">
                            <motion.div
                              animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-primary dark:bg-orange-900 dark:text-orange-300 flex items-center justify-center"
                            >
                              <Wand2 size={16} />
                            </motion.div>
                            <motion.div 
                              className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg p-3"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <div className="flex gap-1">
                                <motion.div
                                  className="w-2 h-2 bg-gray-400 rounded-full"
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-gray-400 rounded-full"
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-gray-400 rounded-full"
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('typeYourMessage') || 'Ask me anything about your career...'}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim() || sendMessageMutation.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Send size={16} />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </>
              ) : (
                /* Welcome Screen */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex items-center justify-center p-8"
                >
                  <div className="text-center max-w-md">
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                    >
                      <Bot className="mx-auto text-primary mb-4" size={80} />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                      {t('welcomeToCareerMentor') || 'Welcome to your AI Career Mentor'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {t('careerMentorDescription') || 'I\'m here to help you with career advice, interview preparation, resume feedback, and professional guidance. Let\'s start a conversation!'}
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => createConversationMutation.mutate()}
                        disabled={createConversationMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        <Plus className="mr-2" size={20} />
                        {t('startConversation') || 'Start Conversation'}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}