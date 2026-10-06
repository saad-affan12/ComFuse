"""Environment Verification Script for Multimodal Customer Complaint Classifier."""
import os
import sys
import platform
import psutil

def verify_environment():
    print("=" * 65)
    print("      MULTIMODAL COMPLAINT CLASSIFIER - ENVIRONMENT CHECK")
    print("=" * 65)
    
    # 1. Python and Interpreter Verification
    python_exec = sys.executable
    is_venv = hasattr(sys, "real_prefix") or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix)
    print(f"Python Version       : {platform.python_version()} ({platform.python_implementation()})")
    print(f"Python Executable    : {python_exec}")
    print(f"Running in Venv      : {is_venv} ({sys.prefix})")
    print(f"Operating System     : {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"CPU Physical / Logical: {psutil.cpu_count(logical=False)} / {psutil.cpu_count(logical=True)}")
    print(f"Total System RAM     : {round(psutil.virtual_memory().total / (1024**3), 2)} GB")
    print("-" * 65)
    
    # 2. PyTorch & Hardware Verification
    import torch
    print(f"PyTorch Version      : {torch.__version__}")
    
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available       : {cuda_available}")
    if cuda_available:
        print(f"CUDA Version         : {torch.version.cuda}")
        print(f"GPU Device Name      : {torch.cuda.get_device_name(0)}")
        print(f"GPU Count            : {torch.cuda.device_count()}")
    else:
        print("GPU / CUDA           : None detected. Utilizing CPU compute.")
        
    mps_available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    print(f"Apple MPS Available  : {mps_available}")
    
    # 3. Core Deep Learning Libraries
    import torchvision
    import transformers
    import datasets
    import sklearn
    import pandas
    import numpy
    import PIL
    import gradio
    
    print("-" * 65)
    print(f"Torchvision Version  : {torchvision.__version__}")
    print(f"Transformers Version : {transformers.__version__}")
    print(f"Datasets Version     : {datasets.__version__}")
    print(f"Scikit-Learn Version : {sklearn.__version__}")
    print(f"Pandas Version       : {pandas.__version__}")
    print(f"NumPy Version        : {numpy.__version__}")
    print(f"Pillow Version       : {PIL.__version__}")
    print(f"Gradio Version       : {gradio.__version__}")
    print("-" * 65)
    
    # 4. Tiny Tensor Sanity Check
    print("Performing sanity tensor computation on selected device...")
    device = torch.device("cuda" if cuda_available else ("mps" if mps_available else "cpu"))
    x = torch.randn(4, 16, device=device)
    linear = torch.nn.Linear(16, 2).to(device)
    y = linear(x)
    print(f"Tensor shape {list(x.shape)} -> Linear(16, 2) on {device} -> Output shape {list(y.shape)}: OK")
    
    print("=" * 65)
    print("✅ ENVIRONMENT VERIFICATION SUCCESSFUL - ALL DEPENDENCIES VALID")
    print("=" * 65)

if __name__ == "__main__":
    verify_environment()
