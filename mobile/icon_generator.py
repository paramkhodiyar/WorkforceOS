import os
from PIL import Image

def generate_icons():
    source_path = "assets/logo.png"
    if not os.path.exists(source_path):
        print(f"Error: Source logo not found at {source_path}")
        return

    print("Opening source logo...")
    im = Image.open(source_path)
    
    # 1. Create a transparent square canvas to avoid stretching
    square_size = max(im.width, im.height)
    square_im = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
    
    # Center the original logo in the square canvas
    offset_x = (square_size - im.width) // 2
    offset_y = (square_size - im.height) // 2
    square_im.paste(im, (offset_x, offset_y))
    
    # Define Android launcher icon sizes and target paths
    android_icon_configs = [
        (48, "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"),
        (72, "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"),
        (96, "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"),
        (144, "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"),
        (192, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"),
    ]
    
    print("Generating Android mipmap launcher icons...")
    for size, target_path in android_icon_configs:
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        # Resize using high-quality lanczos filter
        resized_im = square_im.resize((size, size), Image.Resampling.LANCZOS)
        resized_im.save(target_path, "PNG")
        print(f"Generated: {target_path} ({size}x{size})")

    print("\nLauncher icons generated successfully!")

if __name__ == "__main__":
    generate_icons()
