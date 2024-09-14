export const getGenderLabel = (gender: string) => {
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