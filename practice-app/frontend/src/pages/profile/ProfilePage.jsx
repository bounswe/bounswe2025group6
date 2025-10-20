import React, { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "../../services/authService";
import userService from "../../services/userService";
import "../../styles/ProfilePage.css";
import { useTranslation } from "react-i18next";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState({
    username: "",
    email: "",
    id: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditPhotoClick = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        // Fetch username using userService
        let username = "User";
        let userData = null;
        if (user && user.id) {
          userData = await userService.getUserById(user.id);
          username = userData.username || "User";
        }

        setUserProfile({
          username: username,
          email: user.email || "No email provided",
          currencyPreference:
            userData?.preferredCurrency || "No currency preference set",
          id: user.id,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    const updatedProfile = {
      ...userProfile,
      currencyPreference: newCurrency,
    };
    await userService.updateUserById(userProfile.id, updatedProfile);
    setUserProfile(updatedProfile);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-page container">
      <div className="profile-page-sidebar">
        <ul>
          <li
            onClick={() => setActiveTab("profile")}
            className={activeTab === "profile" ? "active" : ""}
          >
            {t("profile")}
          </li>
          <li
            onClick={() => setActiveTab("recipes")}
            className={activeTab === "recipes" ? "active" : ""}
          >
            {t("recipes")}
          </li>
          <li
            onClick={() => setActiveTab("saved")}
            className={activeTab === "saved" ? "active" : ""}
          >
            {t("savedRecipes")}
          </li>
          <li
            onClick={() => setActiveTab("social")}
            className={activeTab === "social" ? "active" : ""}
          >
            {t("social")}
          </li>
        </ul>
      </div>
      <div className="profile-page-content">
        {activeTab === "profile" && (
          <div className="profile-page-content-profile">
            <h2>{t("profileDetails")}</h2>
            <div
              className="profile-page-content-profile-img"
              style={{
                backgroundImage: profileImage
                  ? `url(${profileImage})`
                  : 'url("https://images.unsplash.com/photo-1557844681-b0da6a516dc9?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
              }}
            ></div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: "none" }}
            />

            <button
              className="profile-page-content-profile-button"
              onClick={handleEditPhotoClick}
            >
              {t("selectPhoto")}
            </button>

            <p>
              <strong>{t("username")}: </strong>
              <span>{userProfile.username}</span>
            </p>
            <p>
              <strong>{t("email")}: </strong>
              <span>{userProfile.email}</span>
            </p>

            <p>
              <strong>{t("currencyPreference")}: </strong>
              {/* <span>
                {userProfile.currencyPreference || "No currency preference set"}
              </span> */}
              <select
                defaultValue={userProfile.currencyPreference}
                onChange={handleCurrencyChange}
              >
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
              </select>
            </p>
          </div>
        )}
        {activeTab === "recipes" && (
          <div className="profile-page-content-recipes">
            <h2>{t("recipes")}</h2>
            <div className="profile-page-content-recipes-list">
              <div className="profile-page-content-recipes-list-item">
                <p>{t("recipeName")}</p>
                <button
                  className="profile-page-content-recipes-list-item-button"
                  style={{ backgroundColor: "#389f6c", color: "white" }}
                  onClick={() => navigate()}
                >
                  {t("details")}
                </button>
                <button
                  className="profile-page-content-recipes-list-item-button"
                  style={{ backgroundColor: "#2c6eae", color: "white" }}
                  onClick={() => navigate()}
                >
                  {t("edit")}
                </button>
                <button
                  className="profile-page-content-recipes-list-item-button"
                  style={{ backgroundColor: "#ec1414", color: "white" }}
                  onClick={() => navigate()}
                >
                  {t("Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "saved" && (
          <div className="profile-page-content-saved">
            <h2>Bookmarked Recipes</h2>
            <div className="profile-page-content-saved-list">
              <div className="profile-page-content-saved-list-item">
                <p>Recipe Name</p>
                <button
                  className="profile-page-content-saved-list-item-button"
                  style={{ backgroundColor: "#389f6c", color: "#fff" }}
                  onClick={() => navigate()}
                >
                  Details
                </button>
              </div>
            </div>

            <h2>Liked Recipes</h2>
            <div className="profile-page-content-saved-list">
              <div className="profile-page-content-saved-list-item">
                <p>Recipe Name</p>
                <button
                  className="profile-page-content-saved-list-item-button"
                  style={{ backgroundColor: "#2c6eae", color: "#fff" }}
                  onClick={() => navigate()}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === "social" && (
          <div className="profile-page-content-social">
            <div className="profile-page-content-social-left">
              <h2>Followed</h2>
              <p>User1</p>
              <p>User2</p>
              <p>User3</p>
              <p>User4</p>
            </div>
            <div className="profile-page-content-social-right">
              <h2>Followers</h2>
              <p>User1</p>
              <p>User2</p>
              <p>User3</p>
              <p>User4</p>
            </div>
          </div>
        )}
        {!["profile", "recipes", "saved", "social"].includes(activeTab) && (
          <div>Select a tab</div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
