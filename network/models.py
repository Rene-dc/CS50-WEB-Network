from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    description = models.CharField(max_length=124)
    followers_count = models.IntegerField(default=0)
    followings_count = models.IntegerField(default=0)

    
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="poster")
    content = models.CharField(max_length=512)
    creation_date = models.DateTimeField(auto_now_add=True)
    likes_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.id}: {self.user} posted: {self.content} on {self.creation_date}"
    
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "likes_count": self.likes_count,
            "creation_date": self.creation_date.strftime("%b %d %Y, %I:%M %p"),
        }

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="liked_posts")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likers")

    def serialize(self):
        return {
            "user": self.user.username,
            "post": self.post.id,
        }

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follows")
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followings")