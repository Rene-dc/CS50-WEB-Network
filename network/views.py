import json
from django.core.paginator import Paginator
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import *


def index(request):
    if request.user.is_authenticated: 
        return render(request, "network/index.html")
    else:
        return render(request, "network/login.html")


@login_required
def posts(request, arg, pagenum):

    if arg == 'all':
        # Get all posts from db
        data = Post.objects.all()
    elif arg == 'follow':
        followed_users = request.user.follows.all().values_list('followed', flat=True)
        data = Post.objects.filter(user__in=followed_users)
    else:
        try:
            data = Post.objects.filter(user=User.objects.get(username=arg))
        except Post.DoesNotExist:
            return JsonResponse({'error': 'No post was found for that user'}, status=400)

    # Return posts in reverse chronologial order
    data = data.order_by("-creation_date").all()
    user = request.user
    liked_posts = user.liked_posts.all()

    # Paginate data
    data = Paginator(data, 10)
    totalpages = data.num_pages
    # Check pagenumber
    if pagenum > totalpages or pagenum < 1:
        return JsonResponse({'error': 'This page wasn\'t found'}, status=400)
    # Get page
    pageposts = data.page(pagenum)

    
    # Serialize posts for JSON
    serialized_posts = []
    for item in pageposts:
        serialized_post = item.serialize()
        for p in liked_posts:
            if p.post_id == item.id:
                serialized_post["liked"] = True
        serialized_posts.append(serialized_post)
    return JsonResponse({
        'posts': serialized_posts, 
        'has_next': pageposts.has_next(),
        'has_previous': pageposts.has_previous(),
    }, safe=False)


@login_required
def newpost(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Check is post is 512 characters long max
    data = json.loads(request.body)
    data = data['content']
    if len(data) > 512:
        return JsonResponse({"error": "Post is too long."}, status=400)
    
    # Try getting user
    try: 
        user = User.objects.get(pk=request.user.id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=400)
    
    # Save post
    newpost = Post(
        user=user,
        content=data
    )
    newpost.save()
    return JsonResponse({"message": "Post now online."}, status=201)


@login_required
def editpost(request, postid):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT request required."}, status=400)
    data = json.loads(request.body)

    post = Post.objects.get(pk=postid)
    user = User.objects.get(username=request.user)

    if post.user.username == user.username:
        post.content = data['content']
        post.save()
        return HttpResponse(status=201)
    else:
        return HttpResponse(status=500)


@login_required
def profile(request, name):

    if request.method != 'GET':
        return JsonResponse({"error": "GET request required."})

    user = name
    # Select user's profile
    data = User.objects.values(
        'username',
        'description', 
        'last_login', 
        'date_joined', 
        'followers_count', 
        'followings_count'
    ).get(username=user)

    # If not last_login
    data["date_joined"] = data["date_joined"].strftime("%b %d %Y, %I:%M %p")
    if data["last_login"] == None:
        data["last_login"] = data["date_joined"]
    else:
        data["last_login"] = data["last_login"].strftime("%b %d %Y, %I:%M %p")

    # Is actual user following ?
    try:
        follows = Follow.objects.get(follower=request.user, followed=User.objects.get(username=user))
    except Follow.DoesNotExist:
        follows = ""
    if str(user) == str(request.user):
        data["follows"] = 'self'
    elif not follows:
        data["follows"] = 'no'
    elif follows:
        data["follows"] = 'yes'

    return JsonResponse(data, safe=False)


@login_required
@csrf_exempt
def follow(request, name):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=400)
    
    # User asking request
    user = User.objects.get(username=request.user)
    
    # Try finding user he's trying to follow
    try:
        target = User.objects.get(username=name)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Target user does not exist.'}, status=400)
    
    # Create follow if it does not already exists, else error
    try:
        Follow.objects.get(follower=user, followed=target)
        return HttpResponse(status=400)
    except Follow.DoesNotExist:
        following = Follow.objects.create(follower=user, followed=target)
        following.save()

    # Update followings count for user
    user.followings_count += 1
    user.save()

    # Update followers count for target
    target.followers_count += 1
    target.save()

    return HttpResponse(status=204)


@login_required
@csrf_exempt
def unfollow(request, name):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=400)
    
    # User asking request
    user = User.objects.get(username=request.user)

    # Try finding user he's trying to unfollow
    try:
        target = User.objects.get(username=name)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Target user does not exist.'}, status=400)

    # Try finding follow, else error
    try:
        following = Follow.objects.get(follower=user, followed=target)
        following.delete()

        # Update followings count for user
        user.followings_count += -1
        user.save()

        # Update followers count for target
        target.followers_count += -1
        target.save()
        
        return HttpResponse(status=204)
    
    except Follow.DoesNotExist:
        return HttpResponse(status=400)
    

@login_required
@csrf_exempt
def like(request, id):
    if request.method != 'POST':
        return JsonResponse({"error": "POST request required."}, status=400)
    
    user = User.objects.get(username=request.user)
    try: 
        Like.objects.get(user=user, post=Post.objects.get(pk=id))
        return HttpResponse(status=400)
    except Like.DoesNotExist:
        isliked = Like.objects.create(user=user, post=Post.objects.get(pk=id))
        isliked.save()

        # Update likes_count
        liked_post = Post.objects.get(pk=id)
        liked_post.likes_count += 1
        liked_post.save()

        return HttpResponse(status=204)


@login_required
@csrf_exempt
def unlike(request, id):
    if request.method != 'POST':
        return JsonResponse({"error": "POST request required."}, status=400)
    
    user = request.user
    try: 
        isliked = Like.objects.get(user=user, post=Post.objects.get(pk=id))
        isliked.delete()

        # Update likes_count
        liked_post = Post.objects.get(pk=id)
        liked_post.likes_count += -1
        liked_post.save()

        return HttpResponse(status=204)
    except Like.DoesNotExist:
        return HttpResponse(status=400)
    

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
