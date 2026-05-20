import React, { useState } from "react";

const ProfilePage = ({ user, handlers }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [location, setLocation] = useState(user.farmDetails?.location || '');
    const [bio, setBio] = useState(user.farmDetails?.bio || '');

    const handleSave = (e) => {
        e.preventDefault();
        handlers.updateProfile(name, email, location, bio);
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-lg text-gray-800">{user.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Email Address</label>
                        <p className="text-lg text-gray-800">{user.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Role</label>
                        <p className="text-lg text-gray-800 capitalize">{user.role}</p>
                    </div>

                    {user.role === 'farmer' && user.farmDetails && (
                        <>
                            <div className="border-t pt-6">
                                <h3 className="text-xl font-semibold text-gray-700">Farm Details</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Farm Name</label>
                                <p className="text-lg text-gray-800">{user.farmDetails.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Location</label>
                                <p className="text-lg text-gray-800">{user.farmDetails.location}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">About My Farm</label>
                                <p className="text-lg text-gray-800 whitespace-pre-wrap">{user.farmDetails.bio}</p>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => handlers.navigateTo(user.role === 'farmer' ? 'farmerDashboard' : 'home')}
                        className="mt-8 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                    >
                        Back
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block font-medium">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                        />
                    </div>

                    {user.role === 'farmer' && (
                        <>
                            <div className="border-t pt-6">
                                <h3 className="text-xl font-semibold">Edit Farm Details</h3>
                            </div>
                            <div>
                                <label className="block font-medium">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block font-medium">About My Farm</label>
                                <textarea
                                    rows="4"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfilePage;
