# Integration Test Coverage Summary

## Overview

This document provides a comprehensive summary of all integration tests in the Fithub backend project. Integration tests verify end-to-end workflows across multiple components, ensuring that different parts of the system work together correctly.

**Total Test Files:** 3  
**Total Test Cases:** 50+  
**Coverage Areas:** Authentication Workflows, Recipe Management, User Interactions, Forum Operations, Reporting System, Rating System, Cross-Module Integration

---

## 1. Core Integration Tests (`api/tests/test_integration.py`)

### 1.1 Authentication Integration Tests

#### Test: `test_complete_user_registration_and_verification_flow`

**What It Tests:**
Complete user registration workflow: register → verify email → login

**Why This Test?**
User registration is the first interaction users have with the system. This test ensures the entire onboarding process works seamlessly, from account creation through email verification to first login. It validates that:
- Registration creates inactive users
- Email verification activates accounts
- Activated users can login successfully
- All components (views, serializers, models, email) work together

**User Scenario Validated:**
1. New user visits registration page
2. User fills out registration form
3. System sends verification email
4. User clicks verification link
5. Account is activated
6. User logs in successfully

**Potential Failure Points Addressed:**
- Email sending failures
- Token generation/verification errors
- User activation state not updating
- Login failing after verification
- Race conditions between registration and verification

---

#### Test: `test_password_reset_code_workflow`

**What It Tests:**
Complete password reset using 6-digit code: request code → verify code → reset password → login

**Why This Test?**
Password reset is a critical security feature. This test ensures the entire flow works correctly, including code generation, email delivery, code verification, token generation, and password update. It validates that:
- Codes are generated and sent
- Codes can be verified
- Tokens are generated after verification
- Passwords are updated correctly
- New password works for login

**User Scenario Validated:**
1. User forgets password
2. User requests reset code
3. User receives 6-digit code via email
4. User enters code to verify
5. System generates reset token
6. User sets new password
7. User logs in with new password

**Potential Failure Points Addressed:**
- Code generation failures
- Email delivery issues
- Code verification errors
- Token generation problems
- Password update failures
- Login with new password failing

---

#### Test: `test_forgot_password_link_workflow`

**What It Tests:**
Alternative password reset method using email link: request link → click link → reset password

**Why This Test?**
Some users prefer email links over codes. This test ensures the alternative reset method works, providing flexibility in password recovery. It validates that:
- Reset links are generated correctly
- Links contain valid tokens
- Password can be reset via link
- New password works

**User Scenario Validated:**
1. User requests password reset link
2. User receives email with reset link
3. User clicks link
4. User sets new password
5. User logs in with new password

**Potential Failure Points Addressed:**
- Link generation errors
- Token encoding/decoding issues
- Link expiration problems
- Password reset via link failing

---

### 1.2 Recipe Workflow Integration Tests

#### Test: `test_complete_recipe_lifecycle`

**What It Tests:**
Full CRUD operations for recipes: create → retrieve → update → list → delete

**Why This Test?**
Recipes are core to the application. This test ensures all recipe operations work together, including creation with ingredients, retrieval, updates, listing, and soft deletion. It validates that:
- Recipes can be created with ingredients
- Recipes can be retrieved by ID
- Recipes can be updated
- Recipe lists work correctly
- Soft deletion removes recipes from lists

**User Scenario Validated:**
1. Chef creates a new recipe with ingredients
2. Chef views the created recipe
3. Chef updates recipe details
4. Chef views recipe in list
5. Chef deletes recipe
6. Recipe no longer appears in list

**Potential Failure Points Addressed:**
- Recipe creation with ingredients failing
- Ingredient relationship errors
- Update operations not persisting
- List pagination issues
- Soft deletion not working
- Deleted recipes appearing in lists

---

#### Test: `test_recipe_search_and_filtering`

**What It Tests:**
Recipe search and filtering by meal type, name, and other attributes

**Why This Test?**
Users need to find recipes easily. This test ensures search and filtering work correctly across different attributes, enabling users to discover relevant recipes. It validates that:
- Recipes can be filtered by meal type
- Search works across recipe names
- Multiple filters can be combined
- Results are accurate

**User Scenario Validated:**
1. User searches for "breakfast" recipes
2. System returns only breakfast recipes
3. User filters by meal type
4. User combines search and filter
5. Results are accurate

**Potential Failure Points Addressed:**
- Filter logic errors
- Search not working
- Incorrect results returned
- Performance issues with large datasets

---

#### Test: `test_recipe_ingredients_relationship`

**What It Tests:**
Recipe creation with multiple ingredients and proper ingredient-recipe relationships

**Why This Test?**
Recipes require ingredients. This test ensures the relationship between recipes and ingredients works correctly, including proper unit conversion and ingredient lookup. It validates that:
- Multiple ingredients can be added to a recipe
- Ingredient units are validated
- Ingredient-recipe relationships are created
- Recipe retrieval includes ingredients

**User Scenario Validated:**
1. Chef creates recipe with multiple ingredients
2. Each ingredient has correct quantity and unit
3. System validates ingredient units
4. Recipe is saved with all ingredients
5. Recipe retrieval shows all ingredients

**Potential Failure Points Addressed:**
- Ingredient relationship creation failures
- Unit validation errors
- Missing ingredients in retrieval
- Unit conversion problems

---

### 1.3 User Interaction Integration Tests

#### Test: `test_follow_unfollow_workflow`

**What It Tests:**
Complete follow/unfollow workflow: follow user → verify following → unfollow → verify unfollowed

**Why This Test?**
Social features are important for user engagement. This test ensures the follow system works correctly, including bidirectional relationships and follower counts. It validates that:
- Users can follow other users
- Follow relationships are created correctly
- Follower counts update
- Users can unfollow
- Relationships are removed correctly

**User Scenario Validated:**
1. User A follows User B
2. User B's follower count increases
3. User A appears in User B's followers
4. User A unfollows User B
5. Follower count decreases
6. Relationship is removed

**Potential Failure Points Addressed:**
- Follow relationship not created
- Follower count not updating
- Unfollow not working
- Bidirectional relationship errors
- Duplicate follow prevention

---

#### Test: `test_bookmark_recipe_workflow`

**What It Tests:**
Recipe bookmarking workflow: bookmark → verify bookmarked → unbookmark → verify unbookmarked

**Why This Test?**
Bookmarking allows users to save recipes for later. This test ensures the bookmark system works correctly, including adding and removing bookmarks. It validates that:
- Recipes can be bookmarked
- Bookmarked recipes appear in user's bookmarks
- Recipes can be unbookmarked
- Bookmarks are user-specific

**User Scenario Validated:**
1. User bookmarks a recipe
2. Recipe appears in user's bookmarks
3. User unbookmarks recipe
4. Recipe removed from bookmarks
5. Other users' bookmarks unaffected

**Potential Failure Points Addressed:**
- Bookmark not saving
- Bookmark not appearing in list
- Unbookmark not working
- Cross-user bookmark leakage
- Duplicate bookmark prevention

---

#### Test: `test_like_recipe_workflow`

**What It Tests:**
Recipe liking workflow: like → verify liked → unlike → verify unliked

**Why This Test?**
Likes provide social feedback. This test ensures the like system works correctly, including toggle functionality and like counts. It validates that:
- Recipes can be liked
- Like status is tracked
- Recipes can be unliked
- Like counts update correctly

**User Scenario Validated:**
1. User likes a recipe
2. Recipe's like count increases
3. User's like status is tracked
4. User unlikes recipe
5. Like count decreases

**Potential Failure Points Addressed:**
- Like not saving
- Like count not updating
- Unlike not working
- Duplicate like prevention
- Like status tracking errors

---

### 1.4 Forum Workflow Integration Tests

#### Test: `test_complete_forum_post_lifecycle`

**What It Tests:**
Complete forum post workflow: create post → add comment → vote → view post

**Why This Test?**
Forum is a key community feature. This test ensures all forum operations work together, including post creation, commenting, and voting. It validates that:
- Posts can be created with tags
- Comments can be added to posts
- Posts can be voted on
- Post data is retrieved correctly

**User Scenario Validated:**
1. User creates forum post with tags
2. Another user comments on post
3. Users vote on post
4. Post view count updates
5. Post shows all interactions

**Potential Failure Points Addressed:**
- Post creation failures
- Tag validation errors
- Comment creation problems
- Voting system errors
- View count not updating

---

### 1.5 Report Workflow Integration Tests

#### Test: `test_complete_report_resolution_workflow`

**What It Tests:**
Complete reporting workflow: create report → admin views → admin resolves

**Why This Test?**
Reporting system ensures content quality. This test ensures the entire reporting and moderation workflow works, from user reporting through admin resolution. It validates that:
- Users can create reports
- Admins can view all reports
- Admins can resolve reports
- Report status updates correctly

**User Scenario Validated:**
1. User reports inappropriate content
2. Report is created with pending status
3. Admin views report in admin panel
4. Admin resolves report (keeps or deletes content)
5. Report status updates to resolved

**Potential Failure Points Addressed:**
- Report creation failures
- Admin access issues
- Resolution actions not working
- Status not updating
- Content deletion errors

---

### 1.6 Rating Integration Tests

#### Test: `test_recipe_rating_workflow`

**What It Tests:**
Recipe rating workflow: create rating → verify rating → update recipe stats

**Why This Test?**
Ratings help users evaluate recipes. This test ensures the rating system works correctly, including rating creation and recipe stat updates. It validates that:
- Users can rate recipes
- Ratings are saved correctly
- Recipe average ratings update
- Rating counts update

**User Scenario Validated:**
1. User rates recipe (taste and difficulty)
2. Rating is saved
3. Recipe's average ratings update
4. Rating counts increment
5. Multiple users can rate same recipe

**Potential Failure Points Addressed:**
- Rating not saving
- Average calculation errors
- Rating count not updating
- Duplicate rating prevention
- Stat update failures

---

#### Test: `test_health_rating_workflow`

**What It Tests:**
Health rating workflow: dietitian creates rating → recipe health score updates

**Why This Test?**
Health ratings provide professional assessments. This test ensures dietitians can rate recipes and health scores are calculated correctly. It validates that:
- Dietitians can create health ratings
- Health scores are saved
- Recipe health scores update
- Only dietitians can rate

**User Scenario Validated:**
1. Dietitian rates recipe's healthiness
2. Health rating is saved
3. Recipe's health score updates
4. Regular users cannot create health ratings

**Potential Failure Points Addressed:**
- Permission errors
- Health score calculation failures
- Rating not saving
- Non-dietitian access

---

### 1.7 Cross-Module Integration Tests

#### Test: `test_user_profile_with_recipe_count`

**What It Tests:**
User profile integration with recipe count and statistics

**Why This Test?**
User profiles aggregate data from multiple modules. This test ensures profile data is correctly calculated and displayed, including recipe counts and ratings. It validates that:
- Recipe counts are accurate
- Profile statistics update
- Data from multiple modules is aggregated

**User Scenario Validated:**
1. User creates multiple recipes
2. User profile shows correct recipe count
3. User receives recipe count badge
4. Profile statistics are accurate

**Potential Failure Points Addressed:**
- Recipe count not updating
- Badge calculation errors
- Profile data inconsistencies
- Aggregation failures

---

#### Test: `test_complete_user_journey`

**What It Tests:**
Complete user journey from registration through recipe creation, interaction, and rating

**Why This Test?**
This is the most comprehensive test, validating the entire user experience. It ensures all major features work together in a realistic user flow. It validates that:
- Registration works
- Recipe creation works
- Social interactions work
- Rating system works
- All features integrate correctly

**User Scenario Validated:**
1. New user registers
2. User verifies email
3. User creates recipe
4. User follows other users
5. User bookmarks recipes
6. User rates recipes
7. All features work together

**Potential Failure Points Addressed:**
- End-to-end workflow failures
- Feature integration issues
- Data consistency problems
- State management errors

---

## 2. Edge Case Integration Tests (`api/tests/test_integration_edge_cases.py`)

### 2.1 Authentication Edge Cases

**Test Cases:**
- `test_register_duplicate_email` - Prevents duplicate accounts
- `test_register_duplicate_username` - Username uniqueness
- `test_register_missing_required_fields` - Validation errors
- `test_login_inactive_user` - Inactive account handling
- `test_login_wrong_password` - Wrong password handling
- `test_password_reset_code_expiration` - Code expiration
- `test_password_reset_invalid_code` - Invalid code handling

**Why These Tests?**
Edge cases in authentication can lead to security vulnerabilities or poor user experience. These tests ensure the system handles invalid inputs, duplicate data, and expired tokens gracefully.

**User Scenarios Validated:**
- User tries to register with existing email (rejected)
- User tries to register with existing username (rejected)
- User submits incomplete registration form (validation errors)
- User tries to login with inactive account (rejected)
- User enters wrong password (clear error message)
- User uses expired reset code (rejected)
- User enters invalid reset code (rejected)

**Potential Failure Points Addressed:**
- Duplicate account creation
- Validation bypass
- Security vulnerabilities
- Poor error messages
- Expired token acceptance

---

### 2.2 Recipe Edge Cases

**Test Cases:**
- `test_create_recipe_with_invalid_meal_type` - Invalid meal type rejection
- `test_create_recipe_with_negative_times` - Negative time validation
- `test_create_recipe_with_invalid_ingredient` - Invalid ingredient handling
- `test_create_recipe_with_invalid_unit` - Unit validation
- `test_update_recipe_not_owned` - Permission check
- `test_delete_recipe_not_owned` - Permission check
- `test_get_nonexistent_recipe` - 404 handling
- `test_create_recipe_empty_name` - Required field validation
- `test_create_recipe_empty_steps` - Required field validation

**Why These Tests?**
Recipe creation and modification must handle invalid data and permission issues. These tests ensure data integrity and proper access control.

**User Scenarios Validated:**
- User tries invalid meal type (rejected)
- User enters negative prep/cook time (rejected)
- User uses non-existent ingredient (rejected)
- User uses invalid unit (rejected)
- User tries to update others' recipe (rejected)
- User tries to delete others' recipe (rejected)
- User requests non-existent recipe (404)
- User creates recipe without name (rejected)
- User creates recipe without steps (rejected)

**Potential Failure Points Addressed:**
- Invalid data acceptance
- Permission bypass
- Data integrity issues
- Missing validation
- Poor error handling

---

### 2.3 User Interaction Edge Cases

**Test Cases:**
- `test_follow_self` - Self-follow prevention
- `test_follow_nonexistent_user` - Invalid user handling
- `test_bookmark_nonexistent_recipe` - Invalid recipe handling
- `test_like_recipe_twice` - Duplicate like prevention
- `test_unbookmark_not_bookmarked_recipe` - Invalid unbookmark handling

**Why These Tests?**
User interactions must handle invalid operations gracefully. These tests ensure the system prevents invalid actions and provides clear error messages.

**User Scenarios Validated:**
- User tries to follow themselves (rejected)
- User tries to follow non-existent user (404)
- User tries to bookmark non-existent recipe (404)
- User tries to like recipe twice (prevented or toggled)
- User tries to unbookmark non-bookmarked recipe (error)

**Potential Failure Points Addressed:**
- Invalid operation acceptance
- Data integrity issues
- Poor error messages
- Duplicate action prevention

---

### 2.4 Forum Edge Cases

**Test Cases:**
- `test_create_post_with_invalid_tags` - Tag validation
- `test_create_post_empty_title` - Required field validation
- `test_comment_on_nonexistent_post` - Invalid post handling
- `test_vote_on_nonexistent_post` - Invalid post handling
- `test_vote_with_invalid_type` - Vote type validation

**Why These Tests?**
Forum operations must validate inputs and handle invalid references. These tests ensure data quality and proper error handling.

**User Scenarios Validated:**
- User creates post with invalid tags (rejected)
- User creates post without title (rejected)
- User comments on non-existent post (404)
- User votes on non-existent post (404)
- User uses invalid vote type (rejected)

**Potential Failure Points Addressed:**
- Invalid tag acceptance
- Missing validation
- Invalid reference handling
- Poor error messages

---

### 2.5 Report Edge Cases

**Test Cases:**
- `test_report_nonexistent_content` - Invalid content handling
- `test_report_invalid_content_type` - Content type validation
- `test_report_invalid_report_type` - Report type validation
- `test_admin_resolve_nonexistent_report` - Invalid report handling

**Why These Tests?**
Reporting system must validate all inputs and handle invalid references. These tests ensure only valid reports can be created and resolved.

**User Scenarios Validated:**
- User reports non-existent content (rejected)
- User uses invalid content type (rejected)
- User uses invalid report type (rejected)
- Admin tries to resolve non-existent report (404)

**Potential Failure Points Addressed:**
- Invalid report creation
- Validation bypass
- Invalid reference handling
- Poor error messages

---

### 2.6 Rating Edge Cases

**Test Cases:**
- `test_rate_nonexistent_recipe` - Invalid recipe handling
- `test_rate_with_invalid_rating_value` - Rating range validation
- `test_rate_with_negative_value` - Negative value rejection
- `test_rate_without_any_rating` - Required rating validation
- `test_health_rating_by_non_dietitian` - Permission check

**Why These Tests?**
Rating system must validate inputs and enforce permissions. These tests ensure only valid ratings are accepted and permissions are enforced.

**User Scenarios Validated:**
- User rates non-existent recipe (404)
- User uses invalid rating value (rejected)
- User enters negative rating (rejected)
- User submits rating without values (rejected)
- Regular user tries health rating (rejected)

**Potential Failure Points Addressed:**
- Invalid rating acceptance
- Permission bypass
- Missing validation
- Poor error messages

---

## 3. Complex Workflow Integration Tests (`api/tests/test_integration_complex.py`)

### 3.1 Complex Workflow Tests

#### Test: `test_complete_recipe_sharing_workflow`

**What It Tests:**
Complex recipe sharing scenario: create → share → others view → others bookmark → others rate

**Why This Test?**
Real-world usage involves multiple users interacting with shared content. This test validates that recipe sharing and social interactions work correctly across multiple users.

**User Scenario Validated:**
1. Chef creates recipe
2. Recipe is shared/discovered
3. Multiple users view recipe
4. Users bookmark recipe
5. Users rate recipe
6. Recipe stats update correctly

**Potential Failure Points Addressed:**
- Multi-user interaction issues
- Stat calculation with multiple ratings
- Bookmark/like count accuracy
- Performance with multiple users

---

#### Test: `test_multi_user_forum_discussion_workflow`

**What It Tests:**
Complex forum discussion: create post → multiple users comment → users vote → discussion thread

**Why This Test?**
Forum discussions involve multiple users. This test ensures threaded discussions, voting, and comment interactions work correctly with multiple participants.

**User Scenario Validated:**
1. User creates forum post
2. Multiple users comment
3. Users vote on post and comments
4. Discussion thread is maintained
5. Vote counts are accurate

**Potential Failure Points Addressed:**
- Thread management issues
- Vote count accuracy
- Comment ordering
- Multi-user concurrency

---

#### Test: `test_recipe_creation_with_multiple_ingredients_performance`

**What It Tests:**
Performance of recipe creation with many ingredients

**Why This Test?**
Complex recipes have many ingredients. This test ensures the system handles recipes with many ingredients efficiently without performance degradation.

**User Scenario Validated:**
1. Chef creates recipe with 20+ ingredients
2. System processes all ingredients
3. Recipe is saved efficiently
4. Recipe retrieval is fast

**Potential Failure Points Addressed:**
- Performance degradation
- Timeout issues
- Memory problems
- Database query optimization

---

#### Test: `test_concurrent_likes_performance`

**What It Tests:**
Performance and correctness with concurrent likes on same recipe

**Why This Test?**
Popular recipes receive many simultaneous likes. This test ensures the system handles concurrent operations correctly without race conditions or data loss.

**User Scenario Validated:**
1. Recipe receives many simultaneous likes
2. All likes are recorded
3. Like count is accurate
4. No data loss or corruption

**Potential Failure Points Addressed:**
- Race conditions
- Data loss
- Count inaccuracy
- Database locking issues

---

#### Test: `test_user_follow_network_workflow`

**What It Tests:**
Complex follow network: user follows multiple users → followers follow back → network grows

**Why This Test?**
Social networks involve complex relationships. This test ensures follow networks work correctly with multiple bidirectional relationships.

**User Scenario Validated:**
1. User follows multiple users
2. Some users follow back
3. Follower counts are accurate
4. Network relationships are correct

**Potential Failure Points Addressed:**
- Relationship tracking errors
- Follower count inaccuracy
- Bidirectional relationship issues
- Network query performance

---

#### Test: `test_recipe_modification_workflow`

**What It Tests:**
Complex recipe modification: create → others bookmark → modify → verify bookmarks still work

**Why This Test?**
Recipe modifications shouldn't break existing relationships. This test ensures that when recipes are modified, bookmarks, likes, and ratings remain valid.

**User Scenario Validated:**
1. Chef creates recipe
2. Users bookmark recipe
3. Chef modifies recipe
4. Bookmarks still work
5. Recipe data is updated correctly

**Potential Failure Points Addressed:**
- Relationship breakage
- Data inconsistency
- Update propagation issues
- Bookmark invalidation

---

#### Test: `test_report_and_resolution_workflow`

**What It Tests:**
Complex reporting scenario: multiple reports → admin reviews → resolves → content handling

**Why This Test?**
Moderation involves handling multiple reports and making decisions. This test ensures the reporting and resolution workflow works correctly with multiple reports.

**User Scenario Validated:**
1. Multiple users report same content
2. Admin views all reports
3. Admin resolves reports
4. Content is handled correctly
5. Report statuses update

**Potential Failure Points Addressed:**
- Multiple report handling
- Resolution workflow issues
- Status update problems
- Content deletion errors

---

#### Test: `test_bulk_recipe_operations`

**What It Tests:**
Performance of bulk operations: create many recipes → list → filter → search

**Why This Test?**
Users may create and search many recipes. This test ensures the system handles bulk operations efficiently.

**User Scenario Validated:**
1. Chef creates 50+ recipes
2. System lists all recipes efficiently
3. Filtering works with many recipes
4. Search is fast
5. Pagination works correctly

**Potential Failure Points Addressed:**
- Performance degradation
- Pagination issues
- Filter performance
- Search speed

---

#### Test: `test_recipe_with_nutrition_calculation`

**What It Tests:**
Nutrition calculation integration: create recipe → calculate nutrition → verify accuracy

**Why This Test?**
Nutrition information is important for users. This test ensures nutrition calculations work correctly based on ingredients and quantities.

**User Scenario Validated:**
1. Chef creates recipe with ingredients
2. System calculates nutrition (calories, macros)
3. Nutrition data is accurate
4. Nutrition updates when recipe changes

**Potential Failure Points Addressed:**
- Calculation errors
- Missing nutrition data
- Update propagation issues
- Unit conversion problems

---

## How Integration Tests Collectively Ensure Core Functionality

### 1. **End-to-End Workflow Validation**
- **Complete User Journeys:** Tests validate entire user workflows from registration through content creation and interaction
- **Multi-Step Processes:** Complex processes like password reset and recipe creation are tested as complete flows
- **State Transitions:** Tests ensure state changes (inactive→active, pending→resolved) work correctly

### 2. **Cross-Module Integration**
- **Data Consistency:** Tests ensure data created in one module is correctly accessible in others
- **Relationship Integrity:** Tests validate relationships between users, recipes, ratings, and other entities
- **Aggregated Data:** Tests ensure profile statistics and counts aggregate correctly from multiple modules

### 3. **Real-World Scenarios**
- **Multi-User Interactions:** Tests simulate realistic scenarios with multiple users interacting
- **Concurrent Operations:** Tests validate system behavior under concurrent load
- **Complex Workflows:** Tests cover complex scenarios like recipe sharing and forum discussions

### 4. **Error Handling and Edge Cases**
- **Invalid Input Handling:** Tests ensure invalid inputs are rejected gracefully
- **Permission Enforcement:** Tests validate access control across modules
- **Boundary Conditions:** Tests cover edge cases like expiration, limits, and invalid references

### 5. **Performance and Scalability**
- **Bulk Operations:** Tests ensure system handles large datasets efficiently
- **Concurrent Access:** Tests validate system behavior under concurrent load
- **Query Optimization:** Tests ensure database queries are efficient

### 6. **Business Logic Validation**
- **Workflow Correctness:** Tests ensure business workflows (registration, moderation, rating) work as designed
- **Rule Enforcement:** Tests validate business rules (dietitian-only ratings, one rating per user) are enforced
- **Data Integrity:** Tests ensure data relationships and constraints are maintained

### 7. **User Experience Assurance**
- **Smooth Workflows:** Tests ensure users can complete tasks without errors
- **Clear Error Messages:** Tests validate error handling provides helpful feedback
- **Feature Integration:** Tests ensure features work together seamlessly

---

## Test Coverage Statistics

- **Authentication Workflows:** 3 core tests + 7 edge case tests
- **Recipe Management:** 3 core tests + 9 edge case tests + 4 complex tests
- **User Interactions:** 3 core tests + 5 edge case tests + 2 complex tests
- **Forum Operations:** 1 core test + 5 edge case tests + 1 complex test
- **Reporting System:** 1 core test + 4 edge case tests + 1 complex test
- **Rating System:** 2 core tests + 5 edge case tests
- **Cross-Module Integration:** 2 core tests + 1 complex test

**Total:** 50+ integration test cases ensuring robust, integrated, and user-friendly backend functionality.

---

## Key Differentiators from Unit Tests

While unit tests focus on individual components, integration tests:

1. **Test Multiple Components Together:** Validate that models, serializers, views, and external services work together
2. **Simulate Real User Flows:** Test complete workflows as users would experience them
3. **Validate Data Flow:** Ensure data flows correctly through the system
4. **Test External Dependencies:** Validate integration with email services, database, and other systems
5. **Performance Testing:** Include performance and concurrency tests
6. **Business Logic Validation:** Ensure business rules are enforced across modules

Together, unit tests and integration tests provide comprehensive coverage, ensuring both individual components and the system as a whole work correctly.

