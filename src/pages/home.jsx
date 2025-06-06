import React, { useState, useEffect } from 'react';
import Profile from './profile';
import '../css/home.css';
import Login from './login';
import Signup from './signup';
import { BrowserRouter } from 'react-router-dom';
import { db, auth } from '../js/firebase';
import { collection, addDoc, getDocs, query as firestoreQuery, orderBy, serverTimestamp, onSnapshot, doc, getDoc } from 'firebase/firestore';
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
    const postsQuery = firestoreQuery(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setPosts(fetchedPosts);
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    return () => unsubscribe();
  }, []);

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
    if (!userData) {
      console.error('No user data available');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        content: text,
        author: userData.username,
        authorImage: userData.profileImage || null,
        timestamp: serverTimestamp(),
        likes: 0,
        userId: auth.currentUser.uid
      });

      setText('');
      setIsPopupOpen(false);
      setActiveSection('home');
    } catch (error) {
      console.error('Error adding post:', error);
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
                    </div>
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
