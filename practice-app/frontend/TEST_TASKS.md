# Frontend Unit Test Tasks

This documentation categorizes the unit tests that need to be added to the frontend and lists the tasks for each test.

## 📊 Current Status

### ✅ Files with Existing Tests (4 files)
1. `src/components/ui/Button.jsx` → `src/__tests__/Button.test.jsx`
2. `src/components/ui/ImageUploader.jsx` → `src/__tests__/ImageUploader.test.jsx`
3. `src/components/recipe/IngredientList.jsx` → `src/__tests__/IngredientList.test.jsx`
4. `src/pages/recipes/RecipeDetailPage.jsx` → `src/__tests__/RecipeDetailPage.test.jsx`

---

## 📝 Missing Tests - Task List

### 🔐 1. Authentication Pages (5 pages)

#### 1.1 LoginPage (`src/pages/auth/LoginPage.jsx`)
**Things to Test:**
- Form rendering (email, password inputs, remember me checkbox)
- Form validation (empty email, invalid email format, empty password)
- Successful login scenario (navigation redirect)
- Error states (wrong credentials, 429 rate limit error)
- "Forgot Password" link functionality
- Remember me checkbox functionality
- Loading state (button disabled when isLoading)
- Translation (i18n) support

**Test File:** `src/__tests__/LoginPage.test.jsx`

---

#### 1.2 RegisterPage (`src/pages/auth/RegisterPage.jsx`)
**Things to Test:**
- Form rendering (all inputs, account type selection)
- Account type selection (user/dietitian)
- Certification URL field visibility when dietitian is selected
- Form validation (username min 3 characters, email format, password requirements)
- Password validation (8 characters, uppercase, lowercase, number)
- Password confirm matching
- Terms and Conditions modal opening and acceptance
- Success screen display after successful registration
- Error states (duplicate email, duplicate username)
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/RegisterPage.test.jsx`

---

#### 1.3 ForgotPasswordPage (`src/pages/auth/ForgotPasswordPage.jsx`)
**Things to Test:**
- First step: Email input rendering and validation
- Transition to code verification screen after email is sent
- Reset code input and validation (6-digit code)
- Transition to password reset screen when code verification is successful
- New password inputs (password and confirm password)
- Password validation (8 characters, uppercase, lowercase, number)
- Success screen when password reset is successful
- Error states at each step
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/ForgotPasswordPage.test.jsx`

---

#### 1.4 ResetPasswordPage (`src/pages/auth/ResetPasswordPage.jsx`)
**Things to Test:**
- Page rendering with token parameter
- Form rendering (newPassword, confirmPassword)
- Password validation
- Password confirm matching
- Invalid token state
- Success screen after successful password reset
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/ResetPasswordPage.test.jsx`

---

#### 1.5 EmailVerificationPage (`src/pages/auth/EmailVerificationPage.jsx`)
**Things to Test:**
- Page rendering with token parameter
- Verification process initiation
- Success screen after successful verification
- Invalid/expired token state
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/EmailVerificationPage.test.jsx`

---

### 🏠 2. Main Pages (2 pages)

#### 2.1 HomePage (`src/pages/HomePage.jsx`)
**Things to Test:**
- Hero section rendering
- Language change dropdown (EN/TR)
- "Go to Dashboard" button when user is authenticated
- "Login" and "Sign Up" buttons when user is unauthenticated
- Features section rendering (6 feature cards)
- How It Works section rendering (3 steps)
- CTA section rendering
- Translation (i18n) support

**Test File:** `src/__tests__/HomePage.test.jsx`

---

#### 2.2 DashboardPage (`src/pages/DashboardPage.jsx`)
**Things to Test:**
- User data loading state
- Welcome message (morning/afternoon/evening)
- Username display
- 4 dashboard card rendering (Meal Planner, Recipes, Shopping List, Community)
- Admin reports card visibility when user is admin
- Admin reports card hidden when user is not admin
- Correct link redirects for each card
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/DashboardPage.test.jsx`

---

### 📖 3. Recipe Pages (3 pages - RecipeDetailPage already exists)

#### 3.1 RecipeDiscoveryPage (`src/pages/recipes/RecipeDiscoveryPage.jsx`)
**Things to Test:**
- Page rendering
- Recipe list fetch and display
- Filtering (meal type, dietary info, difficulty, etc.)
- Sorting (if available)
- Search functionality (if available)
- Pagination (if available)
- Correct recipe card rendering
- Navigation to detail page when recipe card is clicked
- Loading state
- Error handling
- Empty state (when no recipes found)

**Test File:** `src/__tests__/RecipeDiscoveryPage.test.jsx`

---

#### 3.2 UploadRecipePage (`src/pages/recipes/UploadRecipePage.jsx`)
**Things to Test:**
- Form rendering (all inputs)
- Form validation
- Image upload functionality
- Ingredient add/remove
- Step add/edit
- Redirect after successful upload
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/UploadRecipePage.test.jsx`

---

#### 3.3 RecipeEditPage (`src/pages/recipes/RecipeEditPage.jsx`)
**Things to Test:**
- Recipe data fetch and loading into form
- Form rendering (with existing values)
- Form validation
- Image upload/update
- Ingredient add/edit/delete
- Step add/edit/delete
- Redirect after successful update
- Error states
- Loading state
- Unauthorized access (when user is not recipe owner)
- Translation (i18n) support

**Test File:** `src/__tests__/RecipeEditPage.test.jsx`

---

### 💬 4. Community Pages (8 pages/components)

#### 4.1 CommunityPage (`src/pages/community/CommunityPage.jsx`)
**Things to Test:**
- Post list fetch and display
- Post card rendering
- Sorting/filtering (if available)
- Pagination (if available)
- "Create Post" button and redirect
- Navigation to detail page when post is clicked
- Loading state
- Error handling
- Empty state

**Test File:** `src/__tests__/CommunityPage.test.jsx`

---

#### 4.2 PostDetailPage (`src/pages/community/PostDetailPage.jsx`)
**Things to Test:**
- Post data fetch and display
- Post content rendering
- Comments list rendering
- CommentForm component rendering
- VoteButtons component rendering
- Edit/Delete buttons (for post owner)
- Edit/Delete buttons hidden when user is not post owner
- Loading state
- Error handling
- Not found state

**Test File:** `src/__tests__/PostDetailPage.test.jsx`

---

#### 4.3 CreatePostPage (`src/pages/community/CreatePostPage.jsx`)
**Things to Test:**
- Form rendering (title, content, image upload)
- Form validation
- Image upload functionality
- Redirect after successful post creation
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/CreatePostPage.test.jsx`

---

#### 4.4 EditPostPage (`src/pages/community/EditPostPage.jsx`)
**Things to Test:**
- Post data fetch and loading into form
- Form rendering (with existing values)
- Form validation
- Image update functionality
- Redirect after successful update
- Error states
- Loading state
- Unauthorized access (when user is not post owner)
- Translation (i18n) support

**Test File:** `src/__tests__/EditPostPage.test.jsx`

---

#### 4.5 Comment (`src/pages/community/Comment.jsx`)
**Things to Test:**
- Comment rendering (author, content, timestamp)
- Edit button (for comment owner)
- Delete button (for comment owner)
- Edit/Delete buttons hidden when user is not comment owner
- Edit mode open/close
- Comment update functionality
- Comment delete functionality
- Loading state
- Error states

**Test File:** `src/__tests__/Comment.test.jsx`

---

#### 4.6 CommentForm (`src/pages/community/CommentForm.jsx`)
**Things to Test:**
- Form rendering (textarea, submit button)
- Form validation (empty comment cannot be submitted)
- Comment submit functionality
- Form clearing after successful comment
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/CommentForm.test.jsx`

---

#### 4.7 VoteButtons (`src/pages/community/VoteButtons.jsx`)
**Things to Test:**
- Upvote and downvote buttons rendering
- Current vote state display
- Upvote click functionality
- Downvote click functionality
- Vote change (from upvote to downvote)
- Vote removal (clicking same button again)
- Vote count display
- Loading state
- Error states

**Test File:** `src/__tests__/VoteButtons.test.jsx`

---

#### 4.8 UserProfilePage (`src/pages/community/UserProfilePage.jsx`)
**Things to Test:**
- User profile data fetch and display
- User posts list rendering
- User info rendering (username, avatar, bio, etc.)
- Navigation to post detail when post in list is clicked
- Loading state
- Error handling
- Not found state (when user is not found)

**Test File:** `src/__tests__/UserProfilePage.test.jsx`

---

### 👤 5. Profile Pages (1 page)

#### 5.1 ProfilePage (`src/pages/profile/ProfilePage.jsx`)
**Things to Test:**
- User profile data fetch and display
- Profile edit button
- User info rendering (username, email, avatar, bio, preferences)
- Settings link/button
- Loading state
- Error handling
- Translation (i18n) support

**Test File:** `src/__tests__/ProfilePage.test.jsx`

---

### 🥕 6. Ingredients Pages (2 pages)

#### 6.1 IngredientsPage (`src/pages/ingredients/IngredientsPage.jsx`)
**Things to Test:**
- Ingredient list fetch and display
- Search/filter functionality (if available)
- Ingredient card rendering
- Navigation to detail page when ingredient is clicked
- Pagination (if available)
- Loading state
- Error handling
- Empty state

**Test File:** `src/__tests__/IngredientsPage.test.jsx`

---

#### 6.2 IngredientDetailPage (`src/pages/ingredients/IngredientDetailPage.jsx`)
**Things to Test:**
- Ingredient data fetch and display
- Ingredient info rendering (name, nutritional info, allergens, etc.)
- Recipes using this ingredient list (if available)
- Loading state
- Error handling
- Not found state

**Test File:** `src/__tests__/IngredientDetailPage.test.jsx`

---

### 🍽️ 7. Meal Planner Pages (2 pages)

#### 7.1 MealPlannerPage (`src/pages/meal-planner/MealPlannerPage.jsx`)
**Things to Test:**
- Meal planner form rendering
- Date range selection
- Meal type selection (breakfast, lunch, dinner, snack)
- Display of random recipes fitting user's budget for breakfast, lunch, and dinner
- Accessible and localized formats for recipe display
- Meal plan generation based on user ingredients
- Accessible interfaces and fair recipe selection during meal plan generation
- Recipe classification by meal tags with accessible labels
- Support for diverse dietary options in recipe selection
- Recipe selection and adding functionality
- Meal plan creation
- Accessible display of created meal plan (text, visual, or audio options)
- Shopping list generation from meal plans
- Shopping list generation in accessible and local formats
- Allergen detection and accessible warnings during recipe selection
- Allergen warnings inclusive of diverse dietary needs
- Meal plan prioritization by cost, preferences, and availability
- Fair and transparent criteria for meal plan prioritization
- Saved meal plans list (if available)
- Successful meal plan creation
- Error states
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/MealPlannerPage.test.jsx`

---

#### 7.2 SavedMealPlansPage (`src/pages/meal-planner/SavedMealPlansPage.jsx`)
**Things to Test:**
- Saved meal plans list fetch and display
- Meal plan card rendering
- Detail view when meal plan is clicked
- Accessible display of meal plan details (text, visual, or audio options)
- Filtering meal plans by price and preferences
- Accessible controls for meal plan filtering
- Fair algorithms for meal plan filtering
- Meal plan prioritization by cost, preferences, and availability
- Fair and transparent criteria for meal plan prioritization
- Meal plan delete functionality
- Loading state
- Error handling
- Empty state (when no saved meal plans)

**Test File:** `src/__tests__/SavedMealPlansPage.test.jsx`

---

### 🛒 8. Shopping Pages (1 page)

#### 8.1 ShoppingListPage (`src/pages/shopping/ShoppingListPage.jsx`)
**Things to Test:**
- Shopping list rendering
- Ingredient list display
- Accessible and localized formats for shopping list display
- Shopping list generation from meal plans
- Shopping list generation in accessible and local formats
- Transparent calculation of shopping list items
- Accessible and local currency displays for individual items
- Display of total shopping list cost accessibly and in local currency
- Market selection (A101, BIM, Migros, SOK)
- Retailer indication for shopping list items with accessible links
- Standard sharing formats for shopping lists
- Ingredient add/delete
- Check/uncheck functionality
- Market price comparison (if available)
- Allergen detection and accessible warnings for shopping list ingredients
- Allergen warnings inclusive of diverse dietary needs
- Loading state
- Error handling
- Empty state
- Translation (i18n) support

**Test File:** `src/__tests__/ShoppingListPage.test.jsx`

---

### 👨‍💼 9. Admin Pages (2 pages)

#### 9.1 AdminLogin (`src/pages/admin/AdminLogin.jsx`)
**Things to Test:**
- Form rendering (username, password)
- Form validation
- Redirect after successful admin login
- Error states (wrong credentials, non-admin user)
- Loading state
- Translation (i18n) support

**Test File:** `src/__tests__/AdminLogin.test.jsx`

---

#### 9.2 AdminReportsPage (`src/pages/admin/AdminReportsPage.jsx`)
**Things to Test:**
- Reports list fetch and display
- Report card rendering (report type, content, user, timestamp)
- Report detail modal/expand
- Report action buttons (resolve, reject, delete)
- Filtering (report type, status)
- Pagination (if available)
- Loading state
- Error handling
- Empty state
- Unauthorized access (when user is not admin)

**Test File:** `src/__tests__/AdminReportsPage.test.jsx`

---

### ℹ️ 10. Info Pages (1 page)

#### 10.1 TermsPage (`src/pages/info/TermsPage.jsx`)
**Things to Test:**
- Terms content rendering
- TermsContent component rendering
- Translation (i18n) support

**Test File:** `src/__tests__/TermsPage.test.jsx`

---

### 🧩 11. Components (11 components)

#### 11.1 ProtectedRoute (`src/components/auth/ProtectedRoute.jsx`)
**Things to Test:**
- Children rendering when user is authenticated
- Redirect to login page when user is unauthenticated
- Loading state handling

**Test File:** `src/__tests__/ProtectedRoute.test.jsx`

---

#### 11.2 RecipeCard (`src/components/recipe/RecipeCard.jsx`)
**Things to Test:**
- Recipe card rendering (image, title, meal type, ratings)
- Navigation to recipe detail page when card is clicked
- Rating stars display
- Missing image state (default image)

**Test File:** `src/__tests__/RecipeCard.test.jsx`

---

#### 11.3 RatingStars (`src/components/recipe/RatingStars.jsx`)
**Things to Test:**
- Rating stars rendering (1-5 stars)
- Correct number of filled/empty stars display
- Half star display (if available)
- Read-only mode

**Test File:** `src/__tests__/RatingStars.test.jsx`

---

#### 11.4 InteractiveRatingStars (`src/components/recipe/InteractiveRatingStars.jsx`)
**Things to Test:**
- Rating stars rendering
- Hover functionality (preview rating)
- Click functionality (rating selection)
- Rating submit functionality
- Error states
- Loading state

**Test File:** `src/__tests__/InteractiveRatingStars.test.jsx`

---

#### 11.5 InteractiveHealthRating (`src/components/recipe/InteractiveHealthRating.jsx`)
**Things to Test:**
- Health rating slider/rendering
- Rating selection
- Rating submit functionality
- Error states
- Loading state

**Test File:** `src/__tests__/InteractiveHealthRating.test.jsx`

---

#### 11.6 ReportButton (`src/components/report/ReportButton.jsx`)
**Things to Test:**
- Report button rendering
- Modal opening when button is clicked
- ReportModal component rendering

**Test File:** `src/__tests__/ReportButton.test.jsx`

---

#### 11.7 ReportModal (`src/components/report/ReportModal.jsx`)
**Things to Test:**
- Modal rendering (based on isOpen prop)
- Report type selection
- Report reason input
- Report submit functionality
- Modal close functionality
- Form validation
- Error states
- Loading state

**Test File:** `src/__tests__/ReportModal.test.jsx`

---

#### 11.8 Modal (`src/components/ui/Modal.jsx`)
**Things to Test:**
- Modal rendering (based on isOpen prop)
- Modal title rendering
- Children rendering
- Close button functionality
- onClose callback invocation
- Closing on backdrop click (if available)
- Closing on ESC key (if available)

**Test File:** `src/__tests__/Modal.test.jsx`

---

#### 11.9 Toast (`src/components/ui/Toast.jsx`)
**Things to Test:**
- Toast rendering (success, error, info, warning)
- Toast message display
- Auto-dismiss functionality
- Manual dismiss functionality
- Multiple toast support (if available)

**Test File:** `src/__tests__/Toast.test.jsx`

---

#### 11.10 Card (`src/components/ui/Card.jsx`)
**Things to Test:**
- Card rendering
- Card.Header rendering (if available)
- Card.Body rendering
- Card.Footer rendering (if available)
- Custom className support
- Children rendering

**Test File:** `src/__tests__/Card.test.jsx`

---

#### 11.11 TermsContent (`src/components/info/TermsContent.jsx`)
**Things to Test:**
- Terms content rendering
- Sections rendering
- Translation (i18n) support

**Test File:** `src/__tests__/TermsContent.test.jsx`

---

## 📊 Summary

### Total Test Count
- **Pages:** 28 pages
- **Components:** 11 components
- **Total:** 39 files require tests

### Existing Tests
- **Existing:** 4 test files
- **Missing:** 35 test files

### Distribution by Category
1. Authentication Pages: 5 tests
2. Main Pages: 2 tests
3. Recipe Pages: 3 tests (1 already exists)
4. Community Pages: 8 tests
5. Profile Pages: 1 test
6. Ingredients Pages: 2 tests
7. Meal Planner Pages: 2 tests
8. Shopping Pages: 1 test
9. Admin Pages: 2 tests
10. Info Pages: 1 test
11. Components: 11 tests (Button, ImageUploader, IngredientList already exist)

---

## 🛠️ Notes for Writing Tests

### Test Setup
- Jest and React Testing Library are used
- Mock files: `src/test/mocks/`
- Setup file: `src/test/utils/setupTests.js`
- Jest config: `jest.config.js`

### Important Mocks
- `authService` - For authentication operations
- `recipeService` - For recipe operations
- `communityService` - For community operations
- `userService` - For user operations
- `reportService` - For report operations

### Common Test Helpers
- Wrap with `BrowserRouter` (for pages using React Router)
- Wrap with `AuthProvider` (for pages using useAuth hook)
- Wrap with `CurrencyProvider` (for pages using currency context)

### Test Coverage Target
- Minimum 80% coverage should be targeted for each component/page
- 90%+ coverage for critical paths (auth, payments, data submission)

---

## 📌 Priority Order (Recommended)

1. **High Priority:**
   - Authentication Pages (LoginPage, RegisterPage, ForgotPasswordPage)
   - ProtectedRoute component
   - Main Pages (HomePage, DashboardPage)

2. **Medium Priority:**
   - Recipe Pages (RecipeDiscoveryPage, UploadRecipePage, RecipeEditPage)
   - Community Pages (CommunityPage, PostDetailPage, CreatePostPage)
   - ProfilePage

3. **Low Priority:**
   - Ingredients Pages
   - Meal Planner Pages
   - Shopping Pages
   - Admin Pages
   - Info Pages
   - UI Components (Modal, Toast, Card, etc.)

---

Last updated: This documentation was created based on the frontend code structure. This list should be updated when new pages/components are added.

