export default function Modal({ children }) {
  const router = useRouter();
  const dialogRef = useRef(null);

  useEffect(() => {
    // Show the modal when the component is mounted
    dialogRef.current?.showModal();
  }, []);

  const onDismiss = () => {
    // Closes the modal and navigates back in history
    router.back(); 
  };

  return (
    <dialog 
      ref={dialogRef} 
      onClose={onDismiss} // Triggered when hitting ESC or using dialogRef.current.close()
      className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 p-6 rounded-lg shadow-2xl w-full max-w-lg"
    >
      <div className="flex justify-end">
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-900 text-2xl">&times;</button>
      </div>
      {children}
    </dialog>
  );
}