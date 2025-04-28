// src/models/User.js

class User {
    constructor(uid, displayName, email, photoURL, surveys = [], coins) {
        this.uid = uid;           // Unique user ID from Firebase
        this.displayName = displayName; // User's display name
        this.email = email;       // User's email address
        this.photoURL = photoURL; // URL to user's profile picture (optional)
        this.surveys = surveys;   // Array of survey IDs created by the user
        this.coins = coins;
    }

    // Method to update user profile details
    updateProfile(newName, newPhotoURL) {
        this.displayName = newName;
        this.photoURL = newPhotoURL;
    }

    // Method to add a survey ID to the user's surveys array
    addSurvey(surveyId) {
        this.surveys.push(surveyId);
    }

    // Method to convert User object to a JSON-like format for Firestore
    toJson() {
        return {
            uid: this.uid,
            displayName: this.displayName,
            email: this.email,
            photoURL: this.photoURL,
            surveys: this.surveys,
            coins: this.coins,
        };
    }

    // Static method to create a User instance from Firestore data
    static fromFirestore(data) {
        return new User(data.uid, data.displayName, data.email, data.photoURL, data.surveys);
    }
}

export default User;
