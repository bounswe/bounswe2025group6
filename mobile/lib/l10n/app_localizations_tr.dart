// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Turkish (`tr`).
class AppLocalizationsTr extends AppLocalizations {
  AppLocalizationsTr([String locale = 'tr']) : super(locale);

  @override
  String get helloWorld => 'Merhaba Dünya';

  @override
  String get appTitle => 'FitHub';

  @override
  String get dashboardSubtitle =>
      'Yemeklerinizi, tariflerinizi ve planlarınızı burada yönetin.';

  @override
  String get discoverRecipes => 'Tarifleri Keşfet';

  @override
  String get uploadRecipe => 'Tarif Yükle';

  @override
  String get joinCommunity => 'Topluluğa Katıl';

  @override
  String get planMeal => 'Bir Yemek Planla';

  @override
  String get logout => 'Çıkış Yap';

  @override
  String get logoutConfirmation => 'Çıkış yapmak istediğinizden emin misiniz?';

  @override
  String get cancel => 'İptal';

  @override
  String get home => 'Ana Sayfa';

  @override
  String get community => 'Topluluk';

  @override
  String get profile => 'Profil';

  @override
  String get welcomeBack => 'Tekrar hoş geldiniz!';

  @override
  String get discoverRecipesTitle => 'Tarifleri Keşfet';

  @override
  String get searchRecipes => 'Tariflerde Ara';

  @override
  String get maxCost => 'Maksimum Maliyet (ör. 50.0)';

  @override
  String get dietaryOptions => 'Diyet Seçenekleri:';

  @override
  String get sortBy => 'Sırala:';

  @override
  String get dietaryHighProtein => 'Yüksek Protein';

  @override
  String get dietaryLowCarbohydrate => 'Düşük Karbonhidrat';

  @override
  String get dietaryVegetarian => 'Vejetaryen';

  @override
  String get dietaryVegan => 'Vegan';

  @override
  String get dietaryGlutenFree => 'Gluten İçermez';

  @override
  String get dietaryKeto => 'Keto';

  @override
  String get dietaryPaleo => 'Paleo';

  @override
  String get dietaryPescatarian => 'Pesketeryan';

  @override
  String get sortName => 'Ad';

  @override
  String get sortCost => 'Maliyet';

  @override
  String get sortTime => 'Süre';

  @override
  String get noRecipesFound => 'Hiç tarif bulunamadı.';

  @override
  String get noRecipesMatchFilters => 'Seçilen filtrelere uyan tarif yok.';

  @override
  String get noRecipesAvailable => 'Hiç tarif yok.';

  @override
  String errorLoadingRecipes(Object error) {
    return 'Hata: $error';
  }

  @override
  String logoutFailed(Object error) {
    return 'Çıkış başarısız: $error';
  }

  @override
  String get forgotPasswordTitle => 'Şifreyi Unuttum';

  @override
  String get resetPasswordHeading => 'Şifreyi Sıfırla';

  @override
  String get resetPasswordDescription =>
      'E-posta adresinizi girin, şifrenizi sıfırlamak için talimatları size göndereceğiz.';

  @override
  String get emailLabel => 'E-POSTA';

  @override
  String get pleaseEnterEmail => 'Lütfen e-posta adresinizi girin';

  @override
  String get invalidEmail => 'Geçerli bir e-posta girin';

  @override
  String get sendResetLink => 'Sıfırlama Bağlantısını Gönder';

  @override
  String get passwordResetSent =>
      'Şifre sıfırlama kodu e-posta adresinize gönderildi';

  @override
  String get loginTitle => 'Giriş';

  @override
  String get signInToContinue => 'Devam etmek için oturum açın';

  @override
  String get passwordLabel => 'PAROLA';

  @override
  String get pleaseEnterPassword => 'Lütfen parolanızı girin';

  @override
  String get forgotPasswordQuestion => 'Şifremi Unuttum?';

  @override
  String get logInButton => 'Giriş Yap';

  @override
  String get dontHaveAccount => 'Hesabınız yok mu? ';

  @override
  String get createAccount => 'Hesap Oluştur';

  @override
  String get loginSuccessful => 'Giriş başarılı!';

  @override
  String loginFailed(Object message) {
    return 'Giriş başarısız: $message';
  }

  @override
  String failedToObtainJwtTokens(Object error) {
    return 'JWT tokenleri alınamadı: $error';
  }

  @override
  String get createNewPasswordTitle => 'Yeni Parola Oluştur';

  @override
  String get newPasswordLabel => 'Yeni Parola';

  @override
  String get confirmPasswordLabel => 'Parolayı Onayla';

  @override
  String get passwordResetSuccessful => 'Parola sıfırlama başarılı';

  @override
  String get passwordRequired => 'Parola gerekli';

  @override
  String get passwordMinLength => 'Parola en az 8 karakter olmalıdır';

  @override
  String get passwordsDoNotMatch => 'Parolalar eşleşmiyor';

  @override
  String get savePassword => 'Parolayı Kaydet';

  @override
  String get profileTitle => 'Profil';

  @override
  String get myProfileTitle => 'Profilim';

  @override
  String get profileSettingsTooltip => 'Profil Ayarları';

  @override
  String get retry => 'Tekrar Dene';

  @override
  String failedToLoadProfile(Object error) {
    return 'Profil yüklenemedi: $error';
  }

  @override
  String failedToLoadRecipes(Object error) {
    return 'Tarifler yüklenemedi: $error';
  }

  @override
  String get userIdNotAvailable =>
      'Tarifleri yüklemek için kullanıcı kimliği mevcut değil.';

  @override
  String get profileDataNotAvailable => 'Profil verileri mevcut değil.';

  @override
  String get noUserRecipesYet => 'Henüz tarif oluşturmadınız.';

  @override
  String get personalInformation => 'Kişisel Bilgiler';

  @override
  String get preferences => 'Tercihler';

  @override
  String get activityStats => 'Aktivite İstatistikleri';

  @override
  String get localizationAccessibility => 'Yerelleştirme ve Erişilebilirlik';

  @override
  String get communitySection => 'Topluluk';

  @override
  String get myRecipes => 'Tariflerim';

  @override
  String get userType => 'Kullanıcı Türü';

  @override
  String get profileStatus => 'Profil Durumu';

  @override
  String get public => 'Genel';

  @override
  String get private => 'Özel';

  @override
  String get dietaryPreferencesLabel => 'Diyet Tercihleri';

  @override
  String get allergensLabel => 'Alerjenler:';

  @override
  String get dislikedFoodsLabel => 'Sevmediklerim';

  @override
  String get monthlyBudgetLabel => 'Aylık Bütçe';

  @override
  String get notSet => 'Ayarlanmadı';

  @override
  String get recipesCreated => 'Oluşturulan Tarifler';

  @override
  String get avgRecipeRating => 'Ortalama Tarif Puanı';

  @override
  String get cookingSkill => 'Pişirme Becerisi';

  @override
  String get languageLabel => 'Dil';

  @override
  String get dateFormatLabel => 'Tarih Formatı';

  @override
  String get currencyLabel => 'Para Birimi';

  @override
  String get accessibilityLabel => 'Erişilebilirlik';

  @override
  String get nationalityLabel => 'Uyruk';

  @override
  String get dateOfBirthLabel => 'Doğum Tarihi';

  @override
  String get joinedLabel => 'Katılım Tarihi';

  @override
  String get followingLabel => 'Takip Edilenler';

  @override
  String get bookmarkedRecipesLabel => 'Yer İşaretli Tarifler';

  @override
  String get likedRecipesLabel => 'Beğenilen Tarifler';

  @override
  String get users => 'kullanıcı';

  @override
  String get recipes => 'tarif';

  @override
  String get profileSettingsTitle => 'Profil Ayarları';

  @override
  String get settingsSaved => 'Ayarlar kaydedildi!';

  @override
  String failedToSaveSettings(Object error) {
    return 'Ayarlar kaydedilemedi: $error';
  }

  @override
  String get chooseAvatar => 'Avatarınızı Seçin:';

  @override
  String get usernameLabel => 'Kullanıcı Adı';

  @override
  String get usernameEmptyError => 'En az 3 karakter girin';

  @override
  String get dislikedFoodsHint => 'Sevmediklerim (virgülle ayırın)';

  @override
  String get monthlyBudgetHint => 'Aylık Bütçe (\$) (Opsiyonel)';

  @override
  String get publicProfileLabel => 'Genel Profil';

  @override
  String get preferredCurrencyLabel => 'Tercih Edilen Para Birimi';

  @override
  String get accessibilityNeedsLabel => 'Erişilebilirlik İhtiyaçları';

  @override
  String get nationalityOptional => 'Uyruk (Opsiyonel)';

  @override
  String get dateOfBirthOptional => 'Doğum Tarihi (Opsiyonel)';

  @override
  String get recipeDetailsTitle => 'Tarif Detayları';

  @override
  String get ingredientsTitle => 'Malzemeler';

  @override
  String get noIngredients => 'Herhangi bir malzeme listelenmemiş.';

  @override
  String get preparationStepsTitle => 'Hazırlık Adımları';

  @override
  String get noStepsProvided => 'Herhangi bir adım sağlanmamış.';

  @override
  String get costPerServingLabel => 'Porsiyon Başına Maliyet:';

  @override
  String get difficultyLabel => 'Zorluk:';

  @override
  String get tasteRatingLabel => 'Lezzet Puanı:';

  @override
  String get healthRatingLabel => 'Sağlık Puanı:';

  @override
  String get likesLabel => 'Beğeniler:';

  @override
  String get commentsLabel => 'Yorumlar:';

  @override
  String get dietaryInfoLabel => 'Diyet Bilgisi:';

  @override
  String get prepTimeLabel => 'Hazırlama Süresi';

  @override
  String get cookTimeLabel => 'Pişirme Süresi';

  @override
  String get allergenPeanuts => 'Yerfıstığı';

  @override
  String get allergenDairy => 'Süt Ürünleri';

  @override
  String get allergenSoy => 'Soya';

  @override
  String get allergenShellfish => 'Kabuklu Deniz Ürünleri';

  @override
  String get allergenTreeNuts => 'Ağaç Kabuklu Kuruyemişler';

  @override
  String get allergenWheat => 'Buğday';

  @override
  String get registerTitle => 'Kayıt Ol';

  @override
  String get createAccountHeading => 'Hesap Oluştur';

  @override
  String get passwordHelper =>
      'En az 8 karakter, büyük/küçük harf ve sayı içermelidir';

  @override
  String get pleaseConfirmPassword => 'Lütfen parolanızı onaylayın';

  @override
  String get userTypeLabel => 'Kullanıcı Türü';

  @override
  String get uploadPdfButton => 'PDF Yükle (Sertifika)';

  @override
  String get uploadedLabel => 'Yüklendi';

  @override
  String get iAcceptThe => 'Kabul ediyorum ';

  @override
  String get termsAndConditions => 'Hüküm ve Koşullar';

  @override
  String get registerButton => 'Kayıt Ol';

  @override
  String get uploadRecipeTitle => 'Yeni Tarif Yükle';

  @override
  String get recipeNameLabel => 'Tarif Adı';

  @override
  String get enterRecipeNameValidation => 'Lütfen tarif adını girin';

  @override
  String get preparationTimeLabel => 'Hazırlama Süresi (dakika)';

  @override
  String get enterPreparationTime => 'Lütfen hazırlama süresini girin';

  @override
  String get enterValidNumber => 'Lütfen geçerli bir sayı girin';

  @override
  String get timeMustBePositive => 'Süre pozitif olmalıdır';

  @override
  String get cookingTimeLabel => 'Pişirme Süresi (dakika)';

  @override
  String get mealTypeLabel => 'Öğün Türü';

  @override
  String get breakfast => 'Kahvaltı';

  @override
  String get lunch => 'Öğle';

  @override
  String get dinner => 'Akşam';

  @override
  String get selectMealTypeValidation => 'Lütfen bir öğün türü seçin';

  @override
  String get stepsLabel => 'Adımlar';

  @override
  String get stepsHint => 'Her adımı yeni bir satırda girin...';

  @override
  String get enterStepsValidation => 'Lütfen adımları girin';

  @override
  String get ingredientNameLabel => 'Malzeme Adı';

  @override
  String get enterIngredientNameValidation => 'Malzeme adını girin';

  @override
  String get noIngredientsFound => 'Herhangi bir malzeme bulunamadı.';

  @override
  String get quantityLabel => 'Miktar';

  @override
  String get enterQuantityValidation => 'Lütfen miktarı girin';

  @override
  String get quantityPositiveValidation => 'Miktar pozitif olmalıdır';

  @override
  String get unitLabel => 'Birim (ör. adet, su bardağı)';

  @override
  String get removeLabel => 'Kaldır';

  @override
  String get addIngredientLabel => 'Malzeme Ekle';

  @override
  String get uploadRecipeButton => 'Tarifi Yükle';

  @override
  String get recipeUploadedSuccess => 'Tarif başarıyla yüklendi!';

  @override
  String get failedToUploadRecipe => 'Tarif yüklenemedi.';

  @override
  String failedToLoadIngredients(Object error) {
    return 'Malzemeler yüklenemedi: $error';
  }

  @override
  String recipeUploadedButProfileCountFailed(Object error) {
    return 'Tarif yüklendi, ama profil sayısı güncellenemedi: $error';
  }

  @override
  String genericError(Object error) {
    return 'Hata: $error';
  }

  @override
  String get user => 'Kullanıcı';

  @override
  String get dietitian => 'Diyetisyen';

  @override
  String get verifyCodeTitle => 'Doğrulama Kodu';

  @override
  String get verifyResetCodeHeading => 'Sıfırlama Kodunu Doğrula';

  @override
  String enter6DigitCodeSentTo(Object email) {
    return '$email adresine gönderilen 6 haneli kodu girin';
  }

  @override
  String get resetCodeLabel => 'Sıfırlama Kodu';

  @override
  String get pleaseEnterResetCode => 'Lütfen sıfırlama kodunu girin';

  @override
  String get resetCode6Digits => 'Sıfırlama kodu 6 haneli olmalıdır';

  @override
  String get verifyCodeButton => 'Kodu Doğrula';

  @override
  String get codeVerifiedSuccessfully => 'Kod başarıyla doğrulandı';

  @override
  String get voteRemoved => 'Oy kaldırıldı';

  @override
  String get pleaseLogInToVote => 'Lütfen oy kullanmak için giriş yapın.';

  @override
  String get commentUpvoted => 'Yorum beğenildi!';

  @override
  String get commentDownvoted => 'Yorum beğenilmedi!';

  @override
  String voteFailed(Object error) {
    return 'Oy başarısız: $error';
  }

  @override
  String byAuthor(Object author) {
    return '$author tarafından';
  }

  @override
  String get deleteComment => 'Yorumu Sil';

  @override
  String get upvote => 'Beğen';

  @override
  String get downvote => 'Beğenme';

  @override
  String get postUpvoted => 'Gönderi beğenildi!';

  @override
  String get postDownvoted => 'Gönderi beğenilmedi!';

  @override
  String get totalTimeLabel => 'Toplam Süre';

  @override
  String get minutesAbbr => 'dk';

  @override
  String get additionalInformationTitle => 'Ek Bilgiler';

  @override
  String get recipeNotFound => 'Tarif bulunamadı.';

  @override
  String get reportLabel => 'Şikayet Et';

  @override
  String get reportTypeSpam => 'Spam';

  @override
  String get reportTypeSpamDescription => 'İstenmeyen veya tekrarlayan içerik';

  @override
  String get reportTypeInappropriate => 'Uygunsuz İçerik';

  @override
  String get reportTypeInappropriateDescription =>
      'Saldırgan veya uygunsuz materyal';

  @override
  String get reportTypeHarassment => 'Taciz';

  @override
  String get reportTypeHarassmentDescription => 'Zorbalık veya taciz';

  @override
  String get reportTypeOther => 'Diğer';

  @override
  String get reportTypeOtherDescription => 'Diğer sorunlar';

  @override
  String get reportSubmittedSuccess =>
      'Şikayetiniz gönderildi. Geri bildiriminiz için teşekkürler.';

  @override
  String reportSubmitFailed(Object error) {
    return 'Şikayet gönderilemedi: $error';
  }

  @override
  String get recipeFallback => 'Tarif';

  @override
  String get reportWhy => 'Neden şikayet ediyorsunuz?';

  @override
  String get reportAdditionalDetails => 'Ek detaylar (opsiyonel)';

  @override
  String get reportAdditionalDetailsHint =>
      'Bu şikayetle ilgili daha fazla bilgi verin...';

  @override
  String get submitReport => 'Şikayeti Gönder';

  @override
  String get reportThisContent => 'Bu içeriği şikayet et';

  @override
  String get reportPost => 'Gönderiyi Şikayet Et';

  @override
  String get postFallback => 'Gönderi';

  @override
  String get unknown => 'Bilinmiyor';

  @override
  String get deletePostTitle => 'Gönderiyi Sil';

  @override
  String get deletePostConfirmation =>
      'Bu gönderiyi silmek istediğinize emin misiniz?';

  @override
  String get delete => 'Sil';

  @override
  String get commentAdded => 'Yorum eklendi!';

  @override
  String get commentDeleted => 'Yorum silindi!';

  @override
  String get errorTitle => 'Hata';

  @override
  String get postNotFound => 'Gönderi bulunamadı';

  @override
  String get goBack => 'Geri Dön';

  @override
  String get postDetailTitle => 'Gönderi Detayı';

  @override
  String get createdLabel => 'Oluşturulma:';

  @override
  String get commentsTitle => 'Yorumlar';

  @override
  String get addCommentHint => 'Bir yorum ekle...';

  @override
  String get errorLoadingComments => 'Yorumlar yüklenirken hata oluştu:';

  @override
  String get noCommentsYet => 'Henüz yorum yok. İlk yorumu siz yapın!';

  @override
  String get createPostTitle => 'Gönderi Oluştur';

  @override
  String get postButton => 'Paylaş';

  @override
  String get titleLabel => 'Başlık*';

  @override
  String get titleHelper => 'Maksimum 255 karakter';

  @override
  String get titleRequired => 'Başlık gerekli';

  @override
  String get titleTooLong => 'Başlık 255 karakterden az olmalıdır';

  @override
  String get titleTooShort => 'Başlık en az 1 karakter olmalıdır';

  @override
  String get contentLabel => 'İçerik*';

  @override
  String get contentHelper => 'Maksimum 1000 karakter';

  @override
  String get contentRequired => 'İçerik gerekli';

  @override
  String get contentTooLong => 'İçerik 1000 karakterden az olmalıdır';

  @override
  String get contentTooShort => 'İçerik en az 1 karakter olmalıdır';

  @override
  String get allowComments => 'Yorumlara izin ver';

  @override
  String get postCreatedSuccess => 'Gönderi başarıyla oluşturuldu';

  @override
  String get tagsLabel => 'Etiketler*';

  @override
  String get selectedTagsLabel => 'Seçilen Etiketler:';

  @override
  String get tagBudget => 'Bütçe';

  @override
  String get tagMealPrep => 'Yemek Hazırlama';

  @override
  String get tagFamily => 'Aile';

  @override
  String get tagNoWaste => 'Sıfır Atık';

  @override
  String get tagSustainability => 'Sürdürülebilirlik';

  @override
  String get tagTips => 'İpuçları';

  @override
  String get tagGlutenFree => 'Glutensiz';

  @override
  String get tagVegan => 'Vegan';

  @override
  String get tagVegetarian => 'Vejetaryen';

  @override
  String get tagQuick => 'Hızlı';

  @override
  String get tagHealthy => 'Sağlıklı';

  @override
  String get tagStudent => 'Öğrenci';

  @override
  String get tagNutrition => 'Beslenme';

  @override
  String get tagHealthyEating => 'Sağlıklı Beslenme';

  @override
  String get tagSnacks => 'Atıştırmalıklar';

  @override
  String get deleteCommentTitle => 'Yorumu Sil';

  @override
  String get deleteCommentConfirmation =>
      'Bu yorumu silmek istediğinize emin misiniz?';

  @override
  String get deleteCommentCancel => 'İptal';

  @override
  String get deleteCommentDelete => 'Sil';

  @override
  String failedToAddComment(Object error) {
    return 'Yorum eklenemedi: $error';
  }

  @override
  String failedToDeleteComment(Object error) {
    return 'Yorum silinemedi: $error';
  }

  @override
  String get editPostTitle => 'Gönderiyi Düzenle';

  @override
  String get saveButton => 'Kaydet';

  @override
  String get pleaseAcceptTerms => 'Lütfen şartları ve koşulları kabul edin.';

  @override
  String get dietitianMustUploadPdf =>
      'Diyetisyenlerin PDF sertifikası yüklemesi gerekiyor.';

  @override
  String get registrationSuccessfulCheckEmail =>
      'Kayıt başarılı! Lütfen doğrulamak için e-postanızı kontrol edin.';

  @override
  String get termsDialogContent =>
      'FitHub’u kullanarak, aşağıdaki şartları kabul ediyorsunuz:\n\n1. Kişisel bilgileriniz gizlilik politikamıza göre işlenecektir.\n\n2. Hesabınızın gizliliğini korumaktan siz sorumlusunuz.\n\n3. Platformu sorumlu bir şekilde kullanmayı ve zararlı faaliyetlerde bulunmamayı kabul ediyorsunuz.\n\n4. Diyetisyenler geçerli sertifika belgeleri sağlamalıdır.\n\n5. Şartları ihlal eden hesapları sonlandırma hakkımız saklıdır.';

  @override
  String get close => 'Kapat';

  @override
  String get passwordMustContainUppercase =>
      'Parola en az bir büyük harf içermelidir';

  @override
  String get passwordMustContainLowercase =>
      'Parola en az bir küçük harf içermelidir';

  @override
  String get passwordMustContainNumber => 'Parola en az bir rakam içermelidir';

  @override
  String get currencyUsd => 'ABD Doları (\$)';

  @override
  String get currencyTry => 'Türk Lirası (₺)';

  @override
  String get dateFormatMmddyyyy => 'MM/DD/YYYY';

  @override
  String get dateFormatDdmmyyyy => 'DD/MM/YYYY';

  @override
  String get dateFormatYyyymmdd => 'YYYY-MM-DD';

  @override
  String get accessibilityNone => 'Yok';

  @override
  String get accessibilityColorblind => 'Renk Körlüğü';

  @override
  String get accessibilityVisual => 'Görme Engeli';

  @override
  String get accessibilityHearing => 'İşitme Engeli';
}
