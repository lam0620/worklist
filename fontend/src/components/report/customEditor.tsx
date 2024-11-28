import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  AccessibilityHelp,
  Alignment,
  Autosave,
  Bold,
  Essentials,
  FontBackgroundColor,
  FontColor,
  GeneralHtmlSupport,
  Indent,
  IndentBlock,
  Italic,
  Paragraph,
  SelectAll,
  Underline,
  Undo,
  RemoveFormat,
  SourceEditing,
  Clipboard,
} from "ckeditor5";
// import "ckeditor5/ckeditor5.css";

interface CustomEditorProps {
  editor?: typeof ClassicEditor;
  config?: Record<string, any>;
  data?: string;
  onChange?: (event: any, editor: any) => void;
  onReady?: (editor: any) => void;
  disabled?: boolean;
}

const CustomEditor: React.FC<CustomEditorProps> = ({
  editor = ClassicEditor,
  config = {},
  data = "",
  onChange,
  onReady,
  disabled = false,
}) => {
  const defaultConfig = {
    toolbar: {
      items: [
        "clipboard",
        "undo",
        "redo",
        "|",
        "selectAll",
        "|",
        "bold",
        "italic",
        "underline",
        "removeFormat",
        "|",
        "sourceEditing",
        "accessibilityHelp",
      ],
      shouldNotGroupWhenFull: false,
    },
    plugins: [
      AccessibilityHelp,
      Alignment,
      Autosave,
      Bold,
      Essentials,
      FontBackgroundColor,
      FontColor,
      GeneralHtmlSupport,
      Indent,
      IndentBlock,
      Italic,
      Paragraph,
      SelectAll,
      Underline,
      Undo,
      RemoveFormat,
      SourceEditing,
      Clipboard,
    ],
    htmlSupport: {
      allow: [],
    },
    initialData: "",
    placeholder: "Type or paste your content here!",
  };

  const finalConfig = {
    ...defaultConfig,
    // ...config,
  };

  return (
    <CKEditor
      editor={editor}
      config={finalConfig}
      data={data}
      onChange={onChange}
      onReady={onReady}
      disabled={disabled}
    />
  );
};

export default CustomEditor;
