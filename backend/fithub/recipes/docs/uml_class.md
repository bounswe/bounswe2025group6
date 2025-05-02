```mermaid
classDiagram
%%{ init: { "theme": "default", "flowchart": { "curve": "linear" }, "viewBox": true } }%%

  class RegisteredUser {
    +username: String
    +email: String
    +password: String
    +profilePhoto: Media
    +foodAllergies: List<String>
    +notificationPreferences: Map<String, Boolean>
    +profileVisibility: String
    +recipeCount: Integer
    +avgRecipeRating: Double
    +typeOfCook: String
    +followedUsers: List<RegisteredUser>
    +followerUsers: List<RegisteredUser>
    +ratedRecipes: List<Recipe,Double,Double>
    +bookmarkRecipes: List<Recipe>
    +likedRecipes: List<Recipe>
    +viewRecipes()
    +createProfile()
    +createRecipe()
    +applyForHomeCook()
    +editProfile()
    +followUser(RegisteredUser)
    +unFollowUser(RegisteredUser)
    +createDiscussion()
    +makeForumComment()
    +bookmarkRecipe(Recipe)
    +bookmarkMealPlan(MealPlan)
    +submittedRecipes: List<Recipe>
    +commentOnRecipe(Recipe)
    +likeRecipe(Recipe)
    +rateRecipe(Recipe, String, int)
    +askQuestion(title: String, content: String)
    +createMealPlan()
    +deleteAccount()
    +retryDeleteAccount()
    +changeUsername(String)
    +changePassword(String)
    +searchUsers(keyword: String): List<RegisteredUser>
    +RegisteredUser(username: String, email: String, password: String)
    +~RegisteredUser()
  }

  class NonRegisteredUser {
    +register()
    +signIn()
    +forgotPassword()
    +viewTermsAndPrivacyPolicy()
  }

  class Discussion {
    +Title: String
    +initiatorUser: RegisteredUser
    +commentList: List<DiscussionComment>
    +Discussion(Title: String, initiatorUser: RegisteredUser)
    +~Discussion()
  }

  class Dietitian {
    +verificationDocument: Media
    +professionalInfo: Map<String, String>
    +clinicLocation: String
    +website: String
    +provideNutritionAdvice()
    +createMealPlan()
    +rateRecipeHealthiness(Recipe, int)
    +answerQuestion(Question)
    +manageProfessionalDashboard()
    +verifyAccount()
    +Dietitian(verificationDocument: Media, professionalInfo: Map<String, String>, clinicLocation: String, website: String)
    +~Dietitian()
  }
  Dietitian --|> RegisteredUser

  class Admin {
    +manageUserAccounts()
    +approveContent()
    +editContent()
    +removeContent()
    +updateLocalResourceListings()
    +handleReportedContent()
    +banUser(RegisteredUser)
  }
  Admin --|> RegisteredUser

  class Recipe {
    +id: String
    +name: String
    +ingredients: List<Ingredient>
    +steps: List<String>
    +costPerServing: double
    +prepTime: int
    +cookTime: int
    +difficultyRating: double
    +tasteRating: double
    +healthRating: double
    +mealType: String
    +mediaFiles: List<Media>
    +comments: List<RecipeComment>
    +likes: int
    +creator: RegisteredUser
    +isApproved: boolean
    +isFeatured: boolean
    +calculateCost()
    +displaySteps()
    +checkAllergens()
    +addComment(Comment)
    +addLike()
    +removeLike()
    +updateRating(String, int)
    +searchRecipes(keyword: String): List<Recipe>
    +filterRecipes(criteria: Map<String, Object>): List<Recipe>
    +Recipe(id: String, name: String, ingredients: List<Ingredient>, steps: List<String>, prepTime: int, cookTime: int, mealType: String, creator: RegisteredUser)
    +~Recipe()
  }

  class Ingredient {
    +id: String
    +name: String
    +quantity: double
    +unit: String
    +category: String
    +allergens: List<String>
    +dietaryInfo: List<String>
    +displayInfo()
    +searchIngredients(keyword: String): List<Ingredient>
    +filterIngredients(criteria: Map<String, Object>): List<Ingredient>
    +Ingredient(id: String, name: String, quantity: double, unit: String, category: String, allergens: List<String>, dietaryInfo: List<String>)
    +~Ingredient()
  }

  class MealPlan {
    +id: String
    +name: String
    +creationDate: Date
    +timeframe: String
    +meals: Map<Date, Map<String, Recipe>>
    +totalCost: double
    +owner: RegisteredUser
    +visibility: String
    +shoppingList: ShoppingList
    +generateShoppingList()
    +calculateTotalCost()
    +addRecipe(Date, String, Recipe)
    +removeRecipe(Date, String)
    +checkBudgetWarning(double)
    +shareWithFollowers()
    +retrieveCompatiblePlans(filters: Map<String,Object>): List<MealPlan>
    +prioritizePlans(): List<MealPlan>
    +searchMealPlans(keyword: String): List<MealPlan>
    +filterMealPlans(criteria: Map<String, Object>): List<MealPlan>
    +MealPlan(name: String, creationDate: Date, meals: Map<Date, Map<String, Recipe>>, owner: RegisteredUser, visibility: String)
    +~MealPlan()
  }

  class ShoppingList {
    +id: String
    +items: List<Ingredient>
    +totalCost: double
    +retailers: List<Market>
    +mealPlan: MealPlan
    +calculateTotalCost()
    +suggestRetailers()
    +optimizeByPrice()
    +checkAllergens()
    +ShoppingList()
    +~ShoppingList()
  }

  class RecipeComment {
    +id: String
    +content: String
    +timestamp: Date
    +author: RegisteredUser
    +targetRecipe: Recipe
    +deleteRecipeComment()
    +recipeComment()
  }

  class DiscussionComment {
    +id: String
    +content: String
    +timestamp: Date
    +author: RegisteredUser
    +targetDiscussion: Discussion
    +deleteDiscussionComment()
    +DiscussionComment()
  }

  class Media {
    +id: String
    +type: String
    +url: String
    +resolution: String
    +aspectRatio: String
    +altText: String
    +placeholderThumbnail: String
    +caption: String
    +uploadDate: Date
    +uploader: RegisteredUser
    +display()
    +validateQuality()
    +loadPlaceholderIfFail()
    +Media()
  }

  class Market {
    +id: String
    +name: String
    +type: String
    +contactInfo: String
    +productList: List<Ingredient, double>
    +lastRefreshDate: Date
    +refreshPricesAndStock()
    +fallbackToCachedData()
    +displayMarketInfo()
    +searchMarkets(keyword: String): List<Market>
    +filterMarkets(criteria: Map<String, Object>): List<Market>
    +Market(name: String, type: String, contactInfo: String)
    +~Market()
  }

  class Question {
    +id: String
    +title: String
    +content: String
    +timestamp: Date
    +author: RegisteredUser
    +answers: List<Answer>
    +displayQuestion()
    +addAnswer(Answer)
    +Question(title: String, content: String, author: RegisteredUser)
    +~Question()
  }

  class Answer {
    +id: String
    +content: String
    +timestamp: Date
    +author: Dietitian
    +question: Question
    +provideAnswer()
    +displayAnswer()
    +Answer(id: String, content: String, author: Dietitian, question: Question)
    +~Answer()
  }

  class Flag {
    +id: String
    +contentReference: Object
    +reason: FlagType
    +reporter: RegisteredUser
    +timestamp: Date
    +status: FlagStatus
    +reportContent()
    +updateStatus(FlagStatus)
    +Flag(contentReference: Object, reason: String, reporter: RegisteredUser)
    +~Flag()
  }

  class AuthenticationSystem {
    +hashPassword(String): String
    +generateResetToken(): String
    +verifyEmail(String): boolean
    +logIn(String, String): boolean
    +logOut(): void
  }

  class NotificationSystem {
    +notifyUser(RegisteredUser, String)
    +createNotification(String, String)
    +sendEmailNotification(String, String)
    +manageUserPreferences(RegisteredUser)
  }

  class LocalFoodDirectory {
    +lastCrawlDate: Date
    +entries: List<Market>
    +crawlWebSources()                    %% automated every 3 months
    +searchByMetadata(criteria: Map<String,Object>): List<Market>
    +filterByMetadata(criteria: Map<String,Object>): List<Market>
  }

  class DataSyncService {
    +refreshRetailerData()
    +fallbackToLastSuccessfulPull()
    +refreshLocalFoodDirectory()
    +schedulePeriodicJobs()
  }

 class FlagType {
  <<enumeration>>
  Inappropriate
  Spam
  Copyright
  IncorrectData
}

class FlagStatus {
  <<enumeration>>
  Open
  InReview
  Resolved
}

  %% ---------------- RELATIONSHIPS ----------------
  RegisteredUser "1" -- "*" Recipe : creates >
  RegisteredUser "1" -- "*" MealPlan : owns >
  RegisteredUser "1" -- "*" Comment : writes >
  RegisteredUser "*" -- "*" RegisteredUser : follows >
  RegisteredUser "1" -- "*" Question : asks >
  RegisteredUser "1" -- "*" Media : uploads >
  RegisteredUser "1" -- "*" Flag : reports >
  RegisteredUser "1" -- "*" Discussion : creates >
  Flag "1" --> "1" FlagStatus : has>
  Flag "1" --> "1" FlagType   : has>

  Recipe "*" -- "*" Ingredient : contains >
  Recipe "1" --* "*" RecipeComment : receives >
  Recipe "*" -- "*" MealPlan : included in >
  Recipe "*" -- "*" Media : illustrated by >

  MealPlan "1" -- "1" ShoppingList : generates >

  Dietitian "1" -- "*" Answer : provides >
  Dietitian "1" -- "1" Media : includes >

  Question "1" -- "*" Answer : receives >

  Ingredient "*" -- "*" Market : sold at >

  Admin "1" -- "*" Flag : handles >

  Discussion "1" --* "*" DiscussionComment : receives >

  LocalFoodDirectory -- "*" Market : contains >
  DataSyncService ..> Market
  DataSyncService ..> LocalFoodDirectory
```

## Screenshots of Classes
<img width="291" alt="Screenshot 2025-04-29 at 17 11 04" src="https://github.com/user-attachments/assets/4dc0a196-949d-442e-a97f-26c3f2584123" />
<img width="489" alt="Screenshot 2025-04-29 at 17 13 13" src="https://github.com/user-attachments/assets/57dc2291-a649-488d-9d3c-43d8b23379fe" />
<img width="171" alt="Screenshot 2025-04-29 at 17 14 38" src="https://github.com/user-attachments/assets/3ac96291-aa36-4205-ab39-c86df4c9bc2c" />
<img width="599" alt="Screenshot 2025-04-29 at 17 12 52" src="https://github.com/user-attachments/assets/3ef52659-66d5-4808-a0c8-cd19aa394fda" />
<img width="265" alt="Screenshot 2025-04-29 at 17 14 31" src="https://github.com/user-attachments/assets/a7a36ccb-9215-4dd6-aac6-c944ee73315e" />
<img width="88" alt="Screenshot 2025-04-29 at 17 15 20" src="https://github.com/user-attachments/assets/d61b6573-3283-4174-bfe5-3d68d9ba01c1" />
<img width="639" alt="Screenshot 2025-04-29 at 17 12 09" src="https://github.com/user-attachments/assets/657daa35-d44d-4b2a-b730-717256cb5d8c" />
<img width="360" alt="Screenshot 2025-04-29 at 17 14 10" src="https://github.com/user-attachments/assets/8ff31322-bd21-4211-9924-c8ed6a998071" />
<img width="72" alt="Screenshot 2025-04-29 at 17 15 16" src="https://github.com/user-attachments/assets/27376d6b-d61c-478e-88eb-7dd23574b545" />
<img width="255" alt="Screenshot 2025-04-29 at 17 11 56" src="https://github.com/user-attachments/assets/ab155633-fe34-4b56-a103-d9a5fce1f438" />
<img width="130" alt="Screenshot 2025-04-29 at 17 13 51" src="https://github.com/user-attachments/assets/b38f416b-5119-473f-836e-6b4fe3786dda" />
<img width="147" alt="Screenshot 2025-04-29 at 17 14 59" src="https://github.com/user-attachments/assets/2f95a595-7336-49ba-ac8f-bf060eed28bb" />
<img width="220" alt="Screenshot 2025-04-29 at 17 11 36" src="https://github.com/user-attachments/assets/3f113499-a740-4113-ac93-d25cfdd1b187" />
<img width="259" alt="Screenshot 2025-04-29 at 17 13 33" src="https://github.com/user-attachments/assets/19969adf-41df-47b6-b202-dd5e661963d3" />
<img width="315" alt="Screenshot 2025-04-29 at 17 14 54" src="https://github.com/user-attachments/assets/c5b19cba-57a1-464d-994b-c87b66db4ed6" />
<img width="189" alt="Screenshot 2025-04-29 at 17 11 31" src="https://github.com/user-attachments/assets/e8dff7c0-91f8-4c5a-b79d-b46cc141cac0" />
<img width="348" alt="Screenshot 2025-04-29 at 17 13 28" src="https://github.com/user-attachments/assets/55ee832b-9b9f-457e-8337-b20789821a41" />
<img width="251" alt="Screenshot 2025-04-29 at 17 14 48" src="https://github.com/user-attachments/assets/0cec2228-f49a-47a8-aaf2-6006136a1692" />
<img width="153" alt="Screenshot 2025-04-29 at 17 11 26" src="https://github.com/user-attachments/assets/f5ec9bb3-013c-48a6-93c4-d807be67e952" />
<img width="123" alt="Screenshot 2025-04-29 at 17 13 23" src="https://github.com/user-attachments/assets/25125ff3-7428-4dd7-a506-c848ae6344cc" />
<img width="289" alt="Screenshot 2025-04-29 at 17 14 42" src="https://github.com/user-attachments/assets/8da607f7-0815-4c3b-8e6d-2a225f6a0bb6" />
