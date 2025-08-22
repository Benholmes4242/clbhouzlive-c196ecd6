-- Add conversation_type column to conversations table to support different chat types
ALTER TABLE public.conversations 
ADD COLUMN conversation_type text NOT NULL DEFAULT 'chat';

-- Update existing conversations to be 'chat' type
UPDATE public.conversations 
SET conversation_type = 'chat' 
WHERE conversation_type IS NULL OR conversation_type = '';

-- Add check constraint for valid conversation types
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_type_check 
CHECK (conversation_type IN ('chat', 'swing-coach', 'caddie-log'));