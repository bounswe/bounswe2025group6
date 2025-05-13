import React, { useState } from 'react';
import '../../styles/ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="profile-page container">
      <div className="profile-page-sidebar">
        <ul>
          <li onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
            Profile
          </li>
          <li onClick={() => setActiveTab('recipes')} className={activeTab === 'recipes' ? 'active' : ''}>
            Recipes
          </li>
          <li onClick={() => setActiveTab('saved')} className={activeTab === 'saved' ? 'active' : ''}>
            Saved Recipes
          </li>
          <li onClick={() => setActiveTab('social')} className={activeTab === 'social' ? 'active' : ''}>
            Social
          </li>
        </ul>
      </div>
      <div className="profile-page-content">
        {activeTab === 'profile' && <div className='profile-page-content-profile'>
          <h2>Profile Details</h2>
          <div className='profile-page-content-profile-img' style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1557844681-b0da6a516dc9?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
          }}></div>
          <button 
            className="profile-page-content-profile-button" 
            onClick={() => navigate()}>Edit Photo</button>
          <p><strong>Username: </strong><span>User</span></p>
          <p><strong>Email: </strong><span>user@username.com</span></p>
        </div>}
        {activeTab === 'recipes' && <div className='profile-page-content-recipes'>
          <h2>Recipe List</h2>
          <div className='profile-page-content-recipes-list'>
            <div className='profile-page-content-recipes-list-item'>
              <p>Recipe Name</p>
              <button 
                className="profile-page-content-recipes-list-item-button" 
                style={{ backgroundColor: '#389f6c', color: 'white' }}
                onClick={() => navigate()}>Details</button>
              <button 
                className="profile-page-content-recipes-list-item-button" 
                style={{ backgroundColor: '#2c6eae', color: 'white' }}
                onClick={() => navigate()}>Edit</button>
              <button 
                className="profile-page-content-recipes-list-item-button" 
                style={{ backgroundColor: '#ec1414', color: 'white' }}
                onClick={() => navigate()}>Delete</button>
            </div>
          </div>
        </div>}
        {activeTab === 'saved' && <div className='profile-page-content-saved'>
          <h2>Bookmarked Recipes</h2>
          <div className='profile-page-content-saved-list'>
            <div className='profile-page-content-saved-list-item'>
              <p>Recipe Name</p>
              <button 
                className="profile-page-content-saved-list-item-button" 
                style={{ backgroundColor: '#389f6c', color: '#fff' }}
                onClick={() => navigate()}>Details</button>
            </div>
          </div>

          <h2>Liked Recipes</h2>
          <div className='profile-page-content-saved-list'>
            <div className='profile-page-content-saved-list-item'>
              <p>Recipe Name</p>
              <button 
                className="profile-page-content-saved-list-item-button" 
                style={{ backgroundColor: '#2c6eae', color: '#fff' }}
                onClick={() => navigate()}>Details</button>
            </div>
          </div>
        </div>}
        {activeTab === 'social' && <div className='profile-page-content-social'>
          <div  className='profile-page-content-social-left'>
            <h2>Followed</h2>
            <p>User1</p>
            <p>User2</p>
            <p>User3</p>
            <p>User4</p>
          </div>
          <div  className='profile-page-content-social-right'>
            <h2>Followers</h2>
            <p>User1</p>
            <p>User2</p>
            <p>User3</p>
            <p>User4</p>
          </div>
        </div>}
        {!['profile', 'recipes', 'saved', 'social'].includes(activeTab) && <div>Select a tab</div>}
      </div>
    </div>
  );
};

export default ProfilePage;