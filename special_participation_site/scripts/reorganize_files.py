#!/usr/bin/env python3
"""
Reorganize files folder: Rename thread_XXX folders to HW{number}_{ModelName}
"""
import json
import re
from pathlib import Path

def extract_hw_and_model(thread_title, thread_num):
    """Extract homework number and model from thread title."""
    # Extract HW number
    hw_match = re.search(r'\b(?:hw|homework)\s*0*([0-9]+)\b', thread_title, re.IGNORECASE)
    hw_num = hw_match.group(1) if hw_match else "Unknown"
    
    # Extract model name (simplified - you can enhance this)
    model = "Unknown"
    title_lower = thread_title.lower()
    
    if "gpt-5.1" in title_lower or "5.1 thinking" in title_lower or "gpt 5.1" in title_lower:
        model = "GPT-5.1"
    elif "gpt-5" in title_lower or "gpt5" in title_lower or "gpt 5" in title_lower:
        model = "GPT-5"
    elif "gpt-4o" in title_lower or "4o" in title_lower or "chatgpt 4o" in title_lower:
        model = "GPT-4o"
    elif "gpt-o3" in title_lower or "o3" in title_lower:
        model = "GPT-o3"
    elif "gpt-oss" in title_lower or "gpt_oss" in title_lower or "gpt-oss-120b" in title_lower:
        model = "GPT-Oss"
    elif "claude" in title_lower:
        if "opus" in title_lower:
            model = "Claude-Opus"
        elif "sonnet" in title_lower:
            model = "Claude-Sonnet"
        else:
            model = "Claude"
    elif "gemini" in title_lower:
        if "pro" in title_lower or "thinking" in title_lower:
            model = "Gemini-Pro"
        elif "flash" in title_lower or "fast" in title_lower:
            model = "Gemini-Flash"
        else:
            model = "Gemini-Flash"  # Default
    elif "deepseek" in title_lower:
        model = "DeepSeek"
    elif "grok" in title_lower:
        if "4" in title_lower or "4.1" in title_lower:
            model = "Grok-4"
        else:
            model = "Grok"
    elif "kimi" in title_lower:
        model = "Kimi"
    elif "qwen" in title_lower:
        model = "Qwen"
    elif "mistral" in title_lower or "le chat" in title_lower:
        model = "Mistral"
    elif "llama" in title_lower:
        model = "LLaMA"
    elif "gemma" in title_lower:
        model = "Gemma"
    elif "perplexity" in title_lower or "sonar" in title_lower:
        model = "Perplexity"
    
    # Sanitize model name for filesystem
    model = re.sub(r'[<>:"/\\|?*]', '-', model)
    model = model.replace(' ', '-')
    
    return f"HW{hw_num}_{model}"

def reorganize_files():
    """Reorganize files folder structure."""
    base_dir = Path(__file__).parent.parent
    files_dir = base_dir / "files"
    manifest_path = files_dir / "manifest.json"
    
    if not manifest_path.exists():
        print("manifest.json not found!")
        return
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    # First, collect all existing folder names (both thread_* and HW*)
    existing_folders = set()
    for folder in files_dir.iterdir():
        if folder.is_dir():
            existing_folders.add(folder.name)
    
    # Create mapping of old -> new names
    rename_map = {}
    folder_name_map = {}  # Map thread_num to actual new folder name
    used_folder_names = set()  # Track all folder names we plan to use
    
    # Add existing HW* folders to used names
    for folder_name in existing_folders:
        if folder_name.startswith('HW'):
            used_folder_names.add(folder_name)
    
    for thread_num, entry in manifest.items():
        old_folder = files_dir / f"thread_{thread_num}"
        if not old_folder.exists():
            # Check if it was already renamed
            thread_title = entry.get('thread_title', '')
            expected_name = extract_hw_and_model(thread_title, thread_num)
            # Try to find matching folder
            found_folder = None
            for folder_name in existing_folders:
                if folder_name.startswith(expected_name.split('_')[0]):  # Match HW number
                    found_folder = folder_name
                    break
            if found_folder:
                folder_name_map[thread_num] = found_folder
            continue
        
        thread_title = entry.get('thread_title', '')
        new_folder_name = extract_hw_and_model(thread_title, thread_num)
        
        # Handle duplicates by checking both existing folders and planned renames
        final_folder_name = new_folder_name
        counter = 1
        while final_folder_name in used_folder_names or (files_dir / final_folder_name).exists():
            final_folder_name = f"{new_folder_name}_{counter}"
            counter += 1
        
        used_folder_names.add(final_folder_name)
        new_folder = files_dir / final_folder_name
        
        if old_folder != new_folder:
            rename_map[old_folder] = new_folder
            folder_name_map[thread_num] = final_folder_name
    
    # Perform renames
    print(f"Renaming {len(rename_map)} folders...")
    for old_path, new_path in rename_map.items():
        print(f"  {old_path.name} -> {new_path.name}")
        old_path.rename(new_path)
    
    # Update manifest.json paths
    updated_manifest = {}
    for thread_num, entry in manifest.items():
        old_folder_name = f"thread_{thread_num}"
        
        # Get the actual new folder name
        if thread_num in folder_name_map:
            actual_folder = folder_name_map[thread_num]
        else:
            # Check if folder was already renamed or doesn't exist
            actual_folder = old_folder_name
            potential_folder = files_dir / extract_hw_and_model(entry.get('thread_title', ''), thread_num)
            if potential_folder.exists():
                actual_folder = potential_folder.name
        
        # Update file paths in manifest
        updated_files = []
        for file_info in entry.get('files', []):
            updated_file = file_info.copy()
            if 'saved_as' in updated_file:
                updated_file['saved_as'] = updated_file['saved_as'].replace(
                    old_folder_name, actual_folder
                )
            if 'transcript' in updated_file and updated_file['transcript']:
                updated_file['transcript'] = updated_file['transcript'].replace(
                    old_folder_name, actual_folder
                )
            updated_files.append(updated_file)
        
        entry['files'] = updated_files
        updated_manifest[thread_num] = entry
    
    # Save updated manifest
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(updated_manifest, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Reorganization complete! Updated {len(rename_map)} folders.")
    print(f"✓ Updated manifest.json with new paths.")

if __name__ == "__main__":
    reorganize_files()

