// THIS ALERT DIALOG FILE IS NOT USED IN THE PROJECT YET AS OF NOW (5 NOV 2026). IT IS A COMPONENT THAT CAN BE USED IN THE FUTURE.
// THIS FILE IS COMMENTED OUT TO AVOID ERRORS. IT IS KEPT FOR FUTURE USE.

// import * as React from "react";
// import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
// import { cn } from "./utils";
// import { buttonVariants } from "./button";

// function AlertDialog(props) {
//   return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
// }

// function AlertDialogTrigger(props) {
//   return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
// }

// function AlertDialogPortal(props) {
//   return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
// }

// function AlertDialogOverlay({ className, ...props }) {
//   return (
//     <AlertDialogPrimitive.Overlay
//       data-slot="alert-dialog-overlay"
//       className={cn(
//         "fixed inset-0 z-50 bg-black/50",
//         className
//       )}
//       {...props}
//     />
//   );
// }

// function AlertDialogContent({ className, ...props }) {
//   return (
//     <AlertDialogPortal>
//       <AlertDialogOverlay />
//       <AlertDialogPrimitive.Content
//         data-slot="alert-dialog-content"
//         className={cn(
//           "fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg",
//           className
//         )}
//         {...props}
//       />
//     </AlertDialogPortal>
//   );
// }

// function AlertDialogHeader({ className, ...props }) {
//   return (
//     <div
//       data-slot="alert-dialog-header"
//       className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
//       {...props}
//     />
//   );
// }

// function AlertDialogFooter({ className, ...props }) {
//   return (
//     <div
//       data-slot="alert-dialog-footer"
//       className={cn(
//         "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
//         className
//       )}
//       {...props}
//     />
//   );
// }

// function AlertDialogTitle({ className, ...props }) {
//   return (
//     <AlertDialogPrimitive.Title
//       data-slot="alert-dialog-title"
//       className={cn("text-lg font-semibold", className)}
//       {...props}
//     />
//   );
// }

// function AlertDialogDescription({ className, ...props }) {
//   return (
//     <AlertDialogPrimitive.Description
//       data-slot="alert-dialog-description"
//       className={cn("text-sm text-muted-foreground", className)}
//       {...props}
//     />
//   );
// }

// function AlertDialogAction({ className, ...props }) {
//   return (
//     <AlertDialogPrimitive.Action
//       className={cn(
//         buttonVariants(),
//         className
//       )}
//       {...props}
//     />
//   );
// }

// function AlertDialogCancel({ className, ...props }) {
//   return (
//     <AlertDialogPrimitive.Cancel
//       className={cn(
//         buttonVariants({ variant: "outline" }),
//         className
//       )}
//       {...props}
//     />
//   );
// }

// export {
//   AlertDialog,
//   AlertDialogTrigger,
//   AlertDialogPortal,
//   AlertDialogOverlay,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogFooter,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogAction,
//   AlertDialogCancel,
// };
