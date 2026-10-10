// ── New Design System (lowercase) ──────────────────────
export { Button, buttonVariants } from "./button";
export { Input } from "./input";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectField,
} from "./select";
export { Textarea } from "./textarea";
export { Checkbox } from "./checkbox";
export { Switch } from "./switch";
export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "./modal";
export { Drawer } from "./drawer";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
} from "./dropdown-menu";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
export { SchoolPilotToaster, toast } from "./toast";
export { Alert, alertVariants } from "./alert";
export { Badge, badgeVariants } from "./badge";
export { Avatar, avatarVariants } from "./avatar";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from "./card";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";
export { Pagination, PerPageSelect } from "./pagination";
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  PageSkeleton,
  SkeletonForm,
  SkeletonList,
  SkeletonChart,
} from "./skeleton";
export { EmptyState } from "./empty-state";
export { ErrorState } from "./error-state";
export { ConfirmDialog } from "./confirm-dialog";
export { BadgeStatus } from "./badge-status";
export type { StatusType } from "./badge-status";

// ── Legacy components (unique filenames, still used) ────
export { default as PasswordInput } from "./password-input";
export { DataTable } from "./data-table";
export { SlidePanel } from "./slide-panel";
export { ConfirmModal } from "./confirm-modal";
export { ErrorFallback } from "./error-fallback";
export { default as FeatureIcon } from "./feature-icon";
