/**
 * Global Component Exports - Phase 8
 * 
 * Central export file for all standardized UI components.
 * All new features must use these components.
 */

// Core UI Components (Phase 7)
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
export { Button, buttonVariants } from './ui/button';
export { Input } from './ui/input';
export { Badge, badgeVariants } from './ui/badge';
export { Pill, pillVariants } from './ui/pill';

// Form Components
export { Label } from './ui/label';
export { Textarea } from './ui/textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export { Checkbox } from './ui/checkbox';
export { RadioGroup, RadioGroupItem } from './ui/radio-group';
export { Switch } from './ui/switch';

// Feedback Components
export { toast } from 'sonner';
export { Skeleton } from './ui/skeleton';

// Overlay Components
export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Navigation Components
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Display Components
// NOTE: Avatar/AvatarFallback/AvatarImage exports removed — use <SquircleAvatar> from @/components/ui/SquircleAvatar.
// See src/components/ui/AVATAR_GUIDELINES.md.
export { Separator } from './ui/separator';
export { ScrollArea } from './ui/scroll-area';

// Layout Components
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

/**
 * Phase 8 Enforcement:
 * 
 * All new UI elements MUST use components from this file.
 * No ad-hoc div styling allowed.
 * 
 * Required patterns:
 * - Cards → Use <Card> component
 * - Buttons → Use <Button> component with appropriate variant
 * - Inputs → Use <Input> component
 * - Filters/Tags → Use <Pill> component
 * - Status indicators → Use <Badge> component
 * - Forms → Use form components (Label, Input, Textarea, etc.)
 * 
 * See DESIGN_SYSTEM.md for full documentation.
 */
