import { Typography } from "@inkonchain/ink-kit";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-5 ink:bg-button-primary rounded-lg"></div>
      <Typography variant="h4">PrivateDAI</Typography>
    </div>
  );
}