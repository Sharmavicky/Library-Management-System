const mongoose = require("mongoose");
const User = require("../Models/modelExporter").User;
const Issue = require("../Models/modelExporter").Issue;

// Get my profile (Protected route accessible by members only)
exports.getMyProfile = async (req, res) => {
    try {
        // req.user is attached with verifyToken middleware
        const member = await User.findById(req.user._id).select("-password"); // .select("-password") will prevent of returning password.

        return res.status(200).json({
            success: true,
            message: "Profile retreived sucessfully!!",
            member
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// Get all members or user (Protected route accessible by admins only)
exports.getAllMembers = async (req, res) => {
    try {
        // need to fetch only members not admmin and without password
        const members = await User.find({ role: "member" }).select("-password");

        res.status(200).json({
            success: true,
            message: "All Members retreived successfully!!",
            count: members.length,
            members
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        });
    }
};

// Get a member by ID (Protected route, accessible by admins only)
exports.getMemberById = async (req, res) => {
    try {
        const { userId } = req.params;

        // check if userId is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID!!"
            })
        }

        // check if user exist
        const member = await User.findById(userId).select("-password");
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "User not found!!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Member found successfully!!",
            member
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Something went wrong!!',
            error: err.message
        });
    }
};

// Block or Unblock member by ID (Protected route, accessible by admins only)
exports.blockMemberById = async (req, res) => {
    try {
        const { userId } = req.params;

        // check if userId is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID!!",
            })
        }

        // check if member exists
        const member = await User.findById(userId);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "User not found!!"
            })
        }

        // prevent admin from blocking another admin
        if (member.role === "admin") {
            return res.status(400).json({
                success: false,
                message: "Cannot block admin!!"
            })
        }

        // toggle block status
        const updateMember = await User.findByIdAndUpdate(
            userId,
            { isActive: !member.isActive },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: updateMember.isActive ? "Member unblocked successfully!!" : "Member blocked successfully!!",
            member: updateMember
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}

// clear fine of any member by ID (Protected route, accessible by admins only)
exports.clearFine = async (req, res) => {
    try {
       const { userId } = req.params;
        // check if IDs are valid
        if  (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID!!"
            })
        }

        // check if member exists
        const member = await User.findById(userId);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "User not found!!"
            })
        }

        // check if user or member has outstanding balance to clear
        if (member.fine === 0) {
            return res.status(400).json({
                success: false,
                message: "User don't have any outstanding balance to clear!!"
            })
        }

        const clearedAmount = member.fine; // to keep track how much we cleared amount
        await User.findByIdAndUpdate(userId, {
            fine: 0,        // clear fine
            isActive: true  // unblock member after clearing fine
        })
       
        return res.status(200).json({
            success: true,
            message: `Fine of ₹${clearedAmount} cleared successfully!!`,
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
};

// delete a member (protected route, accessible by admins only)
exports.deleteMember = async (req, res) => {
    try {
        const { userId } = req.params;

        // check if userId is valid
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID!!"
            })
        }

        // check if user exists
        const member = await User.findById(userId);
        if (!member) {
            return res.status(404).json({
                success: false,
                messge: "User not found!!"
            })
        }

        // prevent to delete an admin account
        if (member.role === "admin") {
            return res.status(400).json({
                success: false,
                message: "Cannot delete. Admin account!!"
            })
        }

        // check if any book is issed to user 
        const activeIssues = await Issue.find({
            member: userId,
            returned: false,
        });
        if (activeIssues) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete account as member has actively issued books"
            })
        }

        // check if member has an outstanding balance
        if (member.fine > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete account. Member has outstanding balance of ${member.fine}.`
            })
        }

        // all checks passed - delete member
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "Member deleted successfully!!"
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!!",
            error: err.message
        })
    }
}