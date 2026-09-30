import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  FIELD_REST_BG,
  FIELD_REST_BORDER,
  FIELD_FOCUS_BG,
  FIELD_FOCUS_BORDER,
  FIELD_INK,
} from "@/lib/tokens/field"

/**
 * SIX SEPARATE BOXES, NOT ONE SEGMENTED BAR.
 *
 * The shadcn default fuses the slots with `first:rounded-l-md first:border-l
 * last:rounded-r-md`, so the control's whole shape depends on :first-child and
 * :last-child. On iOS that came apart — the sixth slot rendered fully rounded
 * and detached while the other five stayed square (measured on device, 30 Sep
 * 2026: six contiguous 40pt boxes, uniform 10% borders, only the rounding
 * wrong). The same markup fuses correctly in desktop Chromium, so the cause is
 * renderer-specific. A shape held together by sibling selectors has that
 * failure mode built in. Six independent boxes cannot come apart, on any
 * renderer, at any width. Do not reintroduce first:/last: here.
 *
 * THE PAINT IS INLINE ON PURPOSE, AND THIS IS NOT A FIELD-CANON VIOLATION.
 * FIELD_PAINT_CLASS drives its focus step from :focus-within. A slot is a
 * <div>; focus lives on the library's single hidden <input> outside the slot,
 * so :focus-within can never fire on a slot and the class would be inert. The
 * state comes from the library's own `isActive` instead, and every alpha is
 * imported from the canon rather than re-declared. Do not "restore"
 * FIELD_PAINT_CLASS here — it will silently kill the active state.
 *
 * HEIGHT 52 IS A DELIBERATE EXCEPTION to the canon's 44. The canon permits a
 * shorter height with a written reason; this is taller. A digit box carries a
 * 20px glyph and the row of six is the entire tap target for the control.
 *
 * DARK-ONLY, like the canon. Do not add a light branch.
 */

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex w-full items-center has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex w-full items-center gap-2", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, style, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-[52px] flex-1 min-w-0 items-center justify-center rounded-[14px] border text-[20px] font-semibold tabular-nums transition-[background-color,border-color] duration-[140ms] ease-out",
        className
      )}
      style={{
        background: isActive ? FIELD_FOCUS_BG : FIELD_REST_BG,
        borderColor: isActive ? FIELD_FOCUS_BORDER : FIELD_REST_BORDER,
        color: FIELD_INK,
        ...style,
      }}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="h-5 w-[1.5px] animate-caret-blink rounded-[1px] duration-1000"
            style={{ background: FIELD_INK }}
          />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
