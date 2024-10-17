export const getGenderLabel = (gender: string|undefined) => {
    switch (gender) {
      case "F":
        return "Female";
      case "M":
        return "Male";
      case "O":
        return "Other";
      default:
        return "Unknown";
    }
  };


export const formatDate = (dateString: any) => {
  if (!dateString) return "";
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}-${month}-${year}`;
};