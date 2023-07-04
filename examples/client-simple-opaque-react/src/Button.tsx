export default function Button(
  props: Omit<
    React.PropsWithChildren<React.ComponentProps<"button">>,
    "className"
  >
) {
  return (
    <button
      className="px-4 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600 disabled:opacity-50 font-semibold"
      {...props}
    />
  );
}
