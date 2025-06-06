Project Title: Twitter Clone with React and Firebase
Description: a basic social media application.
Features Implemented So Far:
1)User Authentication:
  User Signup with email, password, and username.
  User Login with email and password.
  User Logout.
  User data stored and managed in Firestore.
2)Posting:
  Creating new text posts.
  Saving posts permanently in Firestore.
  Displaying posts in a feed, ordered by timestamp.
  Real-time updates to the post feed as new posts are created or liked.
3)Post Interaction:
  Liking posts (toggling like status and updating like count in real-time).
  Viewing the number of likes on each post.
  Replying to posts (replies stored in a subcollection under each post).
  Viewing replies by clicking the comment button (opens/closes reply section).
  Viewing the number of replies on each post.
4)User Profile:
  A dedicated profile page showing user information (username, email, profile image).
  Displays the total number of likes received on all of the user's posts.
  Allows navigation to the profile page.
5)User Search:
  A search bar to find other users from the Firestore database based on username.
  Displays search results with username and profile image.
6)Technologies Used:
  Frontend:
    React (with Hooks)
    React Router (for navigation)
  Backend/Database:
    Firebase (Authentication for user management)
    Firestore (NoSQL Database for storing users, posts, and replies)
    Firebase SDK

Potential Setup/Installation Requirements (for others):
Node.js and npm (or yarn) installed.
A Firebase project set up with Authentication (Email/Password) and Firestore enabled.
Firebase configuration details (firebaseConfig) added to the project (likely in src/js/firebase.js).
Firestore security rules configured to allow read/write access for authenticated users on users, posts, and posts/{postId}/replies collections (specifically allowing create and update where needed).
