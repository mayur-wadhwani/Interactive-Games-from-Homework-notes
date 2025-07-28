export default function Progress({ value, className = "" }) {
  return (
    <div className={`bg-gray-200 rounded-full h-4 w-full overflow-hidden shadow-inner ${className}`}>
      <div
        className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}