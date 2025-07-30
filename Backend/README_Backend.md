# Backend - OpenAI Processing

This folder contains the Python script that processes raw Facebook posts using OpenAI.

## How to run

1. Create a file named `.env` inside this folder.
2. Inside `.env`, add your OpenAI key like this:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Make sure you install the required packages:

```
pip install -r requirements.txt
```

4. Run the script:

```
python convert_posts.py
```

## Important

- **Do not upload your real `.env` file to GitHub!**
- `.env` is already ignored in `.gitignore`.
