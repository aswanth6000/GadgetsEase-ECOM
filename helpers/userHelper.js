const User = require('../model/user');
const bcrypt = require('bcrypt')
const Address = require('../model/addresses')
const cloudinary = require('../config/cloudinaryConfig')

async function getUserById(userId){
    try{
        const user = await User.findById(userId);
        return user
    }catch(error){
        console.log('Error fetchig user',error);
        return null;
    }
}

async function loginUser(req, email, password) {
    try {
        const user = await User.findOne({ email });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return { success: false, message: "Invalid username or password" };
        }
        if(user.status === 'blocked'){
            return { success : false, message : "User is blocked by admin"}
        }
        req.session.user = user;
        const userm = await User.findById(req.session.user._id);
        req.session.user.status = userm.status
        return { success: true, message: "Login successful" };
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).render('./user/error', { errorMessage: 'Internal Server Error', statusCode : '500' });
    }
}


async function signupUser(username, password, confirmPassword, phone, email) {
    if (password !== confirmPassword) {
        return { success: false, message: "Passwords do not match" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        username: username,
        password: hashedPassword,
        phoneNumber: phone,
        email: email
    });
    try {
        await user.save();
        return { success: true, message: "User registered successfully" };
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).render('./user/error', { errorMessage: 'An error occoured during signup', statusCode : '404' });
    }
}

async function updateProfile(userId, updatedData) {
    try {
        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        return user;
    } catch (error) {
        console.error('Error updating user:', error);
        return null;
    }
}

async function addAddress(userId, type, phone, houseName, name, street, city, state, pinCode) {
    try {
      const userAddress = new Address({
        user: userId,
        type,
        phone,
        houseName,
        name,
        street,
        city,
        state,
        pinCode,
      });
  
      await userAddress.save();
  
      return { success: true, message: 'Address added successfully' };
    } catch (error) {
      console.error('Error adding address:', error);
      return { success: false, message: 'An error occurred while adding address' };
    }
  }
  async function removeAddress(addressIndex) {
    try {
        const address = await Address.findByIdAndRemove(addressIndex);

        if (!address) {
            // Address not found, return an error
            return { success: false, errorMessage: 'Address not found' };
        }

        // No need to save here since the address is already removed by findByIdAndRemove

        return { success: true };
    } catch (error) {
        console.error('Error removing address:', error);
        return { success: false, errorMessage: 'Internal Server Error' };
    }
}
async function editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode) {
    try {
  
      const addressToUpdate = await Address.findById(addressId);
  
      if (!addressToUpdate) {
        return { success: false, message: 'Address not found' };
      }
      addressToUpdate.type = type;
      addressToUpdate.phone = phone;
      addressToUpdate.houseName = houseName;
      addressToUpdate.name = name;
      addressToUpdate.street = street;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
      addressToUpdate.pinCode = pinCode;
      await addressToUpdate.save();
      
      return { success: true, message: 'Address updated successfully' };
    } catch (error) {
      console.error('Error updating address:', error);
      return { success: false, message: 'An error occurred while updating address' };
    }
  }
  
async function resetPassword(phone, newPassword, confirmPassword) {
    try {
        if (newPassword !== confirmPassword) {
            return { success: false, message: "Passwords don't match" };
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await User.findOneAndUpdate(
            { phoneNumber: phone },
            { password: hashedPassword },
            { new: true }
        );
        if (!updatedUser) {
            return { success: false, message: 'User not found' };
        }
        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        console.error("An error occurred during resetting the password:", error);
        return { success: false, message: 'Internal Server Error' };
    }
}

module.exports = {
    loginUser,
    signupUser,
    getUserById,
    updateProfile,
    addAddress,
    removeAddress,
    editAddress,
    resetPassword
};
