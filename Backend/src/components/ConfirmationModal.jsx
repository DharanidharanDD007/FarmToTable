const ConfirmationModal = ({ productName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">Are you sure?</h3>
            <p className="text-gray-600 mb-6">
                Do you really want to delete{" "}
                <span className="font-semibold">{productName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={onCancel}
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;
