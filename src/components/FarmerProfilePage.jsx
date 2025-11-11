import React from "react";

const FarmerProfilePage = ({ farmer }) => {
  if (!farmer) return <p>Farmer not found.</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold">{farmer.name}'s Farm</h2>
        <p className="text-gray-600">Location: {farmer.farmDetails.location}</p>
        <p className="text-gray-600 mt-1">Bio: {farmer.farmDetails.bio}</p>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4">Products</h3>
        {farmer.products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmer.products.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=No+Image'; }}
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="text-xl font-semibold">{p.name}</h4>
                  <p className="text-gray-500 mt-1">{p.stock} in stock</p>
                  <p className="text-green-600 font-bold mt-2">₹{p.price} / {p.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProfilePage;
