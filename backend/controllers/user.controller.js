exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateData = {
      name,
      email,
      phone
    };

    // Only update the profile image if a new one was uploaded
    if (req.file) {
      updateData.profile_image = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profile_image,
      isAdmin: user.is_admin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};