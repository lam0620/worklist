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