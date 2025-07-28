export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}