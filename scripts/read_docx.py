import sys
from docx import Document

def docx_to_markdown(docx_path, output_path):
    doc = Document(docx_path)
    markdown_lines = []
    
    from docx.text.paragraph import Paragraph
    from docx.table import Table
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P

    def iter_block_items(doc_obj):
        for child in doc_obj.element.body:
            if isinstance(child, CT_P):
                yield Paragraph(child, doc_obj)
            elif isinstance(child, CT_Tbl):
                yield Table(child, doc_obj)

    for item in iter_block_items(doc):
        if isinstance(item, Paragraph):
            text = item.text.strip()
            if not text:
                continue
                
            # Determine style
            style_name = item.style.name.lower() if item.style else ""
            
            if 'heading 1' in style_name:
                markdown_lines.append(f"\n# {text}\n")
            elif 'heading 2' in style_name:
                markdown_lines.append(f"\n## {text}\n")
            elif 'heading 3' in style_name:
                markdown_lines.append(f"\n### {text}\n")
            elif 'heading 4' in style_name:
                markdown_lines.append(f"\n#### {text}\n")
            elif 'heading 5' in style_name:
                markdown_lines.append(f"\n##### {text}\n")
            elif 'heading' in style_name:
                markdown_lines.append(f"\n# {text}\n")
            elif 'list bullet' in style_name:
                markdown_lines.append(f"- {text}")
            elif style_name.startswith('list'):
                markdown_lines.append(f"- {text}")
            else:
                # We can also check list format or custom styling
                markdown_lines.append(text + "\n")
        elif isinstance(item, Table):
            markdown_lines.append("\n")
            # Build markdown table
            for i, row in enumerate(item.rows):
                row_cells = []
                for cell in row.cells:
                    cell_text = cell.text.replace('\n', ' ').strip()
                    row_cells.append(cell_text)
                
                # Check for merged cells (adjacent cells with the same text/reference)
                # python-docx represents merged cells as multiple cell objects with the same text or reference.
                # To avoid duplicate columns in markdown, we can merge consecutive identical elements or just print them.
                # Standard markdown requires same number of columns, so print them as is.
                row_text = "| " + " | ".join(row_cells) + " |"
                markdown_lines.append(row_text)
                if i == 0:
                    # Add separator
                    separator = "| " + " | ".join(["---"] * len(row.cells)) + " |"
                    markdown_lines.append(separator)
            markdown_lines.append("\n")
            
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(markdown_lines))
    print(f"Successfully converted to markdown: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python read_docx.py <input_docx> <output_md>")
        sys.exit(1)
    docx_to_markdown(sys.argv[1], sys.argv[2])
