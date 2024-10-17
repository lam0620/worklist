export const getGenderLabel = (gender: string | undefined) => {
  const language = localStorage.getItem("i18nextLng");

  switch (gender) {
    case "F":
      return language === "vi" ? "Nữ" : language === "jp" ? "女性" : "Female";
    case "M":
      return language === "vi" ? "Nam" : language === "jp" ? "男性" : "Male";
    case "O":
      return language === "vi" ? "Khác" : language === "jp" ? "その他" : "Other";
    default:
      return language === "vi" ? "Chưa xác định" : language === "jp" ? "不明" : "Unknown";
  }
};



export const formatDate = (dateString: any) => {
  if (!dateString) return "";
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}-${month}-${year}`;
};