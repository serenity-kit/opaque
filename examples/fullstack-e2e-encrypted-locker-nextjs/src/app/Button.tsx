import classNames from "classnames";

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & { size?: "default" | "small"; variant?: "default" | "muted" };

export default function Button({
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames("font-semibold rounded disabled:opacity-50 ", {
        "bg-blue-500 py-1 px-3 text-white hover:bg-blue-600 disabled:hover:bg-blue-500 shadow":
          variant === "default",
        "text-sm py-1 px-2 text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50":
          size === "small",
      })}
      {...props}
    />
  );
}
