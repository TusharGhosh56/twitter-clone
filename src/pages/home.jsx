import React, { useState, useEffect } from 'react';
import Profile from './profile';
import '../css/home.css';
import Login from './login';
import Signup from './signup';
import { BrowserRouter } from 'react-router-dom';
import { db, auth } from '../js/firebase';
import { collection, addDoc, getDocs, query as firestoreQuery, orderBy, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, where, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import defaultProfile from '/blankprof.png';

const peopleData = [
  { name: "Alice", image: "/img3.jpg" },
  { name: "rahul", image: "/img4.jpg" },
  { name: "kiran", image: "/img5.jpg" },
  { name: "charlie", image: "/img6.jpg" },
];

function Home() {
  const [activeSection, setActiveSection] = useState('home');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [text, setText] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [openRepliesForPostId, setOpenRepliesForPostId] = useState(null); 
  const [currentReplies, setCurrentReplies] = useState([]);
  const [replyTextInput, setReplyTextInput] = useState(''); 

  const WORD_LIMIT = 140;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setActiveSection('home');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData(null);
        }
      } else {
        setIsAuthenticated(false);
        setActiveSection('login');
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    
    const fetchUserLikes = async () => {
      if (isAuthenticated && auth.currentUser?.uid) {
        const userPostsQuery = firestoreQuery(
          collection(db, 'posts'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(userPostsQuery);
        let totalLikes = 0;
        querySnapshot.forEach(doc => {
          const post = doc.data();
          if (post.likes) {
            totalLikes += post.likes.length;
          }
        });
     
        setUserData(prevUserData => ({
          ...prevUserData,
          totalLikes: totalLikes
        }));
      }
    };

    fetchUserLikes();

  }, [isAuthenticated, auth.currentUser?.uid]); 

  useEffect(() => {
    const postsQuery = firestoreQuery(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        likes: doc.data().likes || [],
        replies: doc.data().replies || 0,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setPosts(fetchedPosts);
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, []);

 
  useEffect(() => {
    if (openRepliesForPostId) {
      const repliesQuery = firestoreQuery(
        collection(db, 'posts', openRepliesForPostId, 'replies'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(repliesQuery, (querySnapshot) => {
        const fetchedReplies = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setCurrentReplies(fetchedReplies);
      }, (error) => {
        console.error("Error fetching replies:", error);
      });

     
      return () => unsubscribe();
    } else {
      setCurrentReplies([]); 
    }
  }, [openRepliesForPostId]); 

  const validateWordLimit = (text, limit) => {
    return text.trim().split(/\s+/).length <= limit;
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    if (validateWordLimit(value, WORD_LIMIT)) {
      setText(value);
    }
  };

  const handlePostSubmit = async () => {
    if (!userData || !auth.currentUser) {
      console.error('No user data or user not authenticated');
      return;
    }

    try {
      await addDoc(collection(db, 'posts'), {
        content: text,
        author: userData.username,
        authorImage: userData.profileImage || null,
        timestamp: serverTimestamp(),
        likes: [],
        replies: 0,
        userId: auth.currentUser.uid
      });

      setText('');
      setIsPopupOpen(false);
      setActiveSection('home');
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const handleLike = async (postId, likes) => {
    if (!auth.currentUser) {
      console.error('User not authenticated');
      return;
    }

    const userId = auth.currentUser.uid;
    const postRef = doc(db, 'posts', postId);

    try {
      if (likes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleReplySubmit = async (postId) => {
    if (!auth.currentUser || !userData || !replyTextInput.trim()) {
      console.error('User not authenticated, user data missing, or reply is empty');
      return;
    }

    const replyData = {
      content: replyTextInput,
      author: userData.username,
      authorImage: userData.profileImage || null,
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid
    };

    const postRef = doc(db, 'posts', postId);
    const repliesCollectionRef = collection(postRef, 'replies');

    try {
      await runTransaction(db, async (transaction) => {
        // READ: Get the parent post document first to read its current reply count
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw "Post does not exist!";
        }

        // WRITES: Perform all writes after the read
        // Add the reply to the subcollection
        transaction.set(doc(repliesCollectionRef), replyData);

        // Increment the reply count on the parent post
        const newRepliesCount = (postDoc.data().replies || 0) + 1;
        transaction.update(postRef, { replies: newRepliesCount });
      });

      console.log('Reply added and count incremented');
      setReplyTextInput(''); // Clear input after submission

    } catch (error) {
      console.error('Error adding reply or updating count:', error);
    }
  };

  const filteredPeople = peopleData.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setSearchQuery('');
      }
    }
    if (searchQuery) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  const handleLoginSuccess = (data) => {
    setUserData(data);
  };

  return (
    <BrowserRouter>
      <div className="home-grid">
        <div className="left">
          <div className="logo">𝕩</div>
          <button onClick={() => setActiveSection('home')} className="home-button">Home</button>
          <button 
            onClick={() => setActiveSection('login')} 
            className="home-button"
            style={{ opacity: activeSection === 'login' ? 0.5 : 1 }}
            disabled={activeSection === 'login'}
          >
            Login
          </button>
          <button 
            onClick={() => setIsPopupOpen(true)} 
            className="home-button"
            style={{ opacity: (!isAuthenticated || activeSection !== 'home') ? 0.5 : 1 }}
            disabled={!isAuthenticated || activeSection !== 'home'}
          >
            Post
          </button>
          <div className="profile-button-container">
            <button onClick={() => setActiveSection('profile')} className="profile-button" style={{ padding: 0, border: 'none', background: 'none' }}>
              <img
                src={userData?.profileImage || defaultProfile}
                alt="Profile"
                className="profile-image"
              />
            </button>
          </div>
        </div>

        <div className="center">
          {activeSection === 'profile' && <Profile userData={userData} />}
          {activeSection === 'login' && <Login onSignupClick={() => setActiveSection('signup')} onLoginSuccess={handleLoginSuccess} />}
          {activeSection === 'signup' && <Signup />}
          {activeSection === 'home' && (
            <>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="post-box">
                    <div className="post-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={post.authorImage} alt="Profile" className="post-profile-image" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                      <h3>{post.author}</h3>
                    </div>
                    <p>{post.content}</p>
                    <div className="post-footer">
                      <span>{post.timestamp.toLocaleString()}</span>
                      <button 
                        onClick={() => handleLike(post.id, post.likes)}
                        disabled={!isAuthenticated}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: post.likes.includes(auth.currentUser?.uid) ? '#1da1f2' : '#fff',
                          cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                          opacity: isAuthenticated ? 1 : 0.5,
                        }}
                      >
                        ❤️ {post.likes.length}
                      </button>
                      <button
                        onClick={() => setOpenRepliesForPostId(openRepliesForPostId === post.id ? null : post.id)}
                        disabled={!isAuthenticated}
                         style={{
                          background: 'none',
                          border: 'none',
                          color: openRepliesForPostId === post.id ? '#1da1f2' : '#fff',
                          cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                          opacity: isAuthenticated ? 1 : 0.5,
                        }}
                      >
                        💬 {post.replies}
                      </button>
                    </div>
                    {openRepliesForPostId === post.id && (
                      <div className="replies-section">
                        <div className="reply-input-area">
                          <textarea
                            placeholder="Write a reply..."
                            value={replyTextInput}
                            onChange={(e) => setReplyTextInput(e.target.value)}
                            className="reply-textarea"
                          />
                          <button 
                            onClick={() => handleReplySubmit(post.id)}
                            disabled={!replyTextInput.trim()}
                            className="reply-submit-btn"
                          >
                            Reply
                          </button>
                        </div>
                        <div className="replies-list">
                          {currentReplies.map(reply => (
                            <div key={reply.id} className="reply-item">
                              <div className="reply-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={reply.authorImage || defaultProfile} alt="Reply Author" className="reply-profile-image" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                <strong>{reply.author}</strong>
                                <span>{reply.timestamp.toLocaleString()}</span>
                              </div>
                              <p>{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No posts yet. Click "Post" to create one.</p>
              )}
            </>
          )}
        </div>

        <div className="right">
          <div id="search-container" style={{ position: 'relative', width: '100%' }}>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search names..."
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                resize: "none",
                border: "1px solid #ccc",
                borderRadius: "4px",
                marginBottom: "10px",
                outline: "none",
                boxSizing: "border-box",
                backgroundColor: "#f5f5f5",
                transition: "border-color 0.2s ease",
                textAlign: "left",
                lineHeight: "1.2",
                height: "40px",
                overflow: "hidden"
              }}
              rows={1}
            />
            {searchQuery && (
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'hidden',
                  border: '1px solid #ccc',
                  marginTop: '5px',
                  borderRadius: '4px',
                  background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  position: 'absolute',
                  width: '100%',
                  zIndex: 1000,
                  left: 0,
                }}
              >
                {filteredPeople.length > 0 ? (
                  filteredPeople.map((person, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderBottom: '1px solid #eee',
                        cursor: 'default',
                        width: '100%',
                        boxSizing: 'border-box',
                        color: 'black',
                      }}
                    >
                      <img
                        src={person.image}
                        alt={person.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginRight: '10px',
                        }}
                      />
                      <span>{person.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="results" style={{ padding: '10px', color: '#666', width: '100%', boxSizing: 'border-box' }}>No matches found</div>
                )}
              </div>
            )}
          </div>

          <div className="right-feed1">
            <img src="/img2.png" alt="no image found" />
            <p>Static feed content...</p>
          </div>
          <div className="right-feed2">
            Proverb of the day: Actions speak louder than words.
          </div>
          <div className="right-feed3">
            BREAKING NEWS: RCB finally wins the title!
          </div>
        </div>

        {isPopupOpen && (
          <div className="popup-overlay">
            <div className="popup">
              <h3 className="popup-title">Create a Post</h3>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder={`Max ${WORD_LIMIT} words`}
                rows={5}
                className="popup-textarea"
              />
              <div className="popup-buttons">
                <button className="popup-btn" onClick={handlePostSubmit}>Post</button>
                <button className="popup-btn" onClick={() => setIsPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default Home;
