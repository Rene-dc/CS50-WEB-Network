document.addEventListener('DOMContentLoaded', () => {

    // By default, load all posts
    posts('all', 1)

    // Check size of the screen
    menus();

    // Wait for click on mobile hamburger
    document.querySelector('.hamburger').onclick = () => mobile_menu();

    // Give action to the nav-links
    document.querySelectorAll('#all').forEach(button => {
        button.onclick = () => {
            posts('all', 1);
            mobile_menu();
        };
    });
    document.querySelector('#following').onclick = () => {
        posts('follow', 1);
        mobile_menu();
    };
    document.querySelector('#profile').onclick = () => {
        const username = window.username;
        profile(username);
        mobile_menu();
        //window.history.pushState("{username: self", "", `profile/${username}`);
    };

    // Check for window resizing
    window.onresize = () => menus();
    
    // Wait for new post
    document.querySelector('form').onsubmit = () => {
        const content = document.querySelector('#newPostBody').value;
        const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;
        // Check length of post body
        if (content === '' || content.length > 512) {
        return false;
        } 

        fetch('/newpost', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                content: content,
            })
        })
        .then(response => {
            if (response.status === 201) {
                document.querySelector('#newPostBody').value = ''
                posts('all', 1);
                return false;
            } else {
                return false;
            }
        });
        return false;
    }

});

function mobile_menu() {
    if (window.innerWidth < 1100) {
        document.querySelector('.hamburger').classList.toggle('opened');
        document.querySelector('#navbar').classList.toggle('openedmenu');
    }
}

function menus() {
    if (window.innerWidth < 1100) {
        document.querySelector('#navbar').setAttribute('class', 'mobile-navbar')
    } else {
        document.querySelector('#navbar').setAttribute('class', 'main-navbar')
    }
}

function posts(arg, pagenum) {

    // Possible args :
    // all -> all posts
    // follow -> followed users posts
    // pseudo -> posts from user with pseudo

    // Clear other views
    if (arg === 'follow' || arg === 'all') {
        document.querySelector('#newpost').style.display = 'block';
        document.querySelector('#allposts').style.display = 'block';
        document.querySelector('#profileview').style.display = 'none';
    }

    // Clear posts div
    document.querySelector('#allposts').innerHTML = '';

    // Get all posts
    fetch(`/posts/${arg}/${pagenum}`)
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {

            // Create div for each post
            const postContainer = document.createElement('div');
            postContainer.setAttribute('class', 'postContainer');
            postContainer.setAttribute('id', post.id);

            // Create div for user, content, like icon, likes_count and date
            const user = document.createElement('div');
            user.setAttribute('class', 'username');
            user.innerHTML = post.user;

            // Click on username
            user.onclick = () => profile(post.user);

            const content = document.createElement('div');
            content.setAttribute('class', 'content');
            content.innerHTML = post.content;

            // Like buttons and counters
            const likeIcon = document.createElement('div');
            if (post.liked) {
                
                // Add unlike icon
                const image = document.createElement('img');
                image.setAttribute('id', 'likeImage');
                image.setAttribute('src', '/static/network/images/unlike_button3.svg');
                image.setAttribute('alt', 'unlike post icon')
                
                // Unlike button and function
                const unlikeButton = document.createElement('button');
                unlikeButton.setAttribute('id', 'like');
                unlikeButton.appendChild(image);
                unlikeButton.onclick = () => unlike(post.id);
                
                // Add all to div
                likeIcon.setAttribute('class', 'like');
                likeIcon.appendChild(unlikeButton);
                
            } else {
                
                // Add like icon
                const image = document.createElement('img');
                image.setAttribute('id', 'likeImage');
                image.setAttribute('src', '/static/network/images/like_button2.svg');
                image.setAttribute('alt', 'like post icon')
                
                // Like button and function
                const likeButton = document.createElement('button')
                likeButton.setAttribute('id', 'like');
                likeButton.appendChild(image);
                likeButton.onclick = () => like(post.id);
                
                // Add all to div
                likeIcon.setAttribute('class', 'like');
                likeIcon.appendChild(likeButton);
            }

            const likes_count = document.createElement('div');
            likes_count.setAttribute('class', 'likes_count');
            post.likes_count ? likes_count.innerHTML = post.likes_count : likes_count.innerHTML = 0;
            
            const date = document.createElement('div');
            date.setAttribute('class', 'date');
            date.innerHTML = post.creation_date;

            const infos = document.createElement('div');
            infos.setAttribute('class', 'infos');

            const likeInfos = document.createElement('div');
            likeInfos.setAttribute('class', 'likeinfos');

            likeInfos.appendChild(likeIcon);
            likeInfos.appendChild(likes_count);
            infos.appendChild(likeInfos);
            if (window.username === post.user) {
                const editbutton = document.createElement('button');
                editbutton.setAttribute('class', 'editbutton')
                const editimage = document.createElement('img');
                editimage.setAttribute('id', 'editImage');
                editimage.setAttribute('src', '/static/network/images/edit_button2.svg');
                editimage.setAttribute('alt', 'edit post icon');
                editbutton.appendChild(editimage);
                editbutton.onclick = () => editPost(post.id);
                infos.appendChild(editbutton);
            }
            infos.appendChild(date);

            postContainer.appendChild(user);
            postContainer.appendChild(content);
            postContainer.appendChild(infos);
            
            document.querySelector('#allposts').appendChild(postContainer);
        });

        // Create div if buttons
        const pagebuttons = document.createElement('div'); 
        pagebuttons.setAttribute('class', 'pagebuttons');
        const n = data.has_next;
        const p = data.has_previous;

        // Create page buttons
        if (p) {
            const previouspage = parseInt(pagenum) - 1;
            const previousbutton = document.createElement('button');
            previousbutton.setAttribute('class', 'previous');
            previousbutton.setAttribute('id', (parseInt(pagenum) - 1));
            const previousicon = document.createElement('img');
            previousicon.setAttribute('src', '/static/network/images/previous_button.svg');
            previousbutton.appendChild(previousicon);
            previousbutton.onclick = () => posts(arg, previouspage);
            pagebuttons.appendChild(previousbutton);
        }
        if (n) {
            const nextpage = parseInt(pagenum) + 1;
            const nextbutton = document.createElement('button');
            nextbutton.setAttribute('class', 'next');
            nextbutton.setAttribute('id', nextpage);
            const nexticon = document.createElement('img');
            nexticon.setAttribute('src', '/static/network/images/next_button.svg');
            nextbutton.appendChild(nexticon);
            nextbutton.onclick = () => posts(arg, nextpage);
            pagebuttons.appendChild(nextbutton);
        }
        if (n || p) {
            document.getElementById('allposts').appendChild(pagebuttons);
        }
    });
}

function profile(user) {

    // Clear other views
    document.querySelector('#newpost').style.display = 'none';
    document.querySelector('#allposts').style.display = 'block';
    document.querySelector('#profileview').style.display = 'block';

    // Clear profile div
    document.querySelector('#profileview').innerHTML = '';

    fetch(`/profile/${user}`)
    .then(response => response.json())
    .then(profile => {
        const username = document.createElement('div');
        username.setAttribute('class', 'username');
        username.innerHTML = profile.username;

        const joined = document.createElement('div');
        joined.setAttribute('class', 'joined');
        joined.innerHTML = 'Joined NETWORK on : ' + profile.date_joined;

        const last_login = document.createElement('div');
        last_login.setAttribute('class', 'last_login');
        last_login.innerHTML = 'Last seen on : ' + profile.last_login;

        const description = document.createElement('div');
        description.setAttribute('class', 'description');
        description.innerHTML = profile.description;

        const followers = document.createElement('div'); 
        followers.setAttribute('class', 'followers');
        const focount = document.createElement('p');
        focount.setAttribute('class', 'count');
        focount.setAttribute('id', 'focount');
        const fotext = document.createElement('p');
        fotext.setAttribute('class', 'text');
        focount.innerHTML = profile.followers_count;
        fotext.innerHTML = ' follower(s)';
        followers.appendChild(focount);
        followers.appendChild(fotext);
        
        const followings = document.createElement('div');
        followings.setAttribute('class', 'followings');
        const ficount = document.createElement('p');
        ficount.setAttribute('class', 'count');
        const fitext = document.createElement('p');
        fitext.setAttribute('class', 'text');
        ficount.innerHTML = profile.followings_count;
        fitext.innerHTML = ' subcription(s)';
        followings.appendChild(ficount);
        followings.appendChild(fitext);

        const container = document.querySelector('#profileview');
        container.appendChild(username);
        container.appendChild(description);
        container.appendChild(joined);
        container.appendChild(last_login);
        container.appendChild(followers);
        container.appendChild(followings);

        // Follow button and functions
        // If profile.follows === 'self', no button created
        if (profile.follows === 'no') {
            const follow = document.createElement('button');
            follow.setAttribute('class', 'followbutton');
            follow.innerHTML = 'FOLLOW';
            follow.onclick = () => addfollow(profile.username);
            container.appendChild(follow);
        } else if (profile.follows === 'yes') {
            const follow = document.createElement('button');
            follow.setAttribute('class', 'followbutton');
            follow.innerHTML = 'UNFOLLOW';
            follow.onclick = () => unfollow(profile.username);
            container.appendChild(follow);
        };

        posts(profile.username, 1);
    });
}

function like(post_id) {
    fetch(`/like/${post_id}`, {
        method: 'POST',
    })
    .then(response => {
        if (response.status === 204) {

            stringId = String(post_id)
            // Search for post
            const post = document.getElementById(stringId);

            // Update likes count
            post.querySelector('.likes_count').innerHTML = parseInt(post.querySelector('.likes_count').innerHTML) + 1;
            
            // Change image
            const image = post.querySelector('#likeImage');
            image.setAttribute('src', '/static/network/images/unlike_button3.svg');
            
            // Change onclick function unlike
            post.querySelector('#like').onclick = () => unlike(post_id);
        }
    });
}

function unlike(post_id) {
    fetch(`/unlike/${post_id}`, {
        method: 'POST',
    })
    .then(response => {
        if (response.status === 204) {
            
            stringId = String(post_id)
            // Search for post
            const post = document.getElementById(stringId);
            
            // Update likes count
            post.querySelector('.likes_count').innerHTML = parseInt(post.querySelector('.likes_count').innerHTML) - 1;
            
            // Change image
            const image = post.querySelector('#likeImage');
            image.setAttribute('src', '/static/network/images/like_button2.svg');
            
            // Remove Event Listener for like and addEventListener for unlike
            post.querySelector('#like').onclick = () => like(post_id);
        }
    });
}

function addfollow(user) {
    fetch(`/follow/${user}`, {
        method: 'POST',
    })
    .then (response => {
        if (response.status === 204) {
            // Update user's followers count
            const profileContainer = document.querySelector('#profileview')
            profileContainer.querySelector('#focount').innerHTML = parseInt(profileContainer.querySelector('#focount').innerHTML) + 1;

            // Change button text and function
            const button = profileContainer.querySelector('.followbutton');
            button.innerHTML = 'UNFOLLOW';
            button.onclick = () => unfollow(user);
        }
    })
}

function unfollow(user) {
    fetch(`/unfollow/${user}`, {
        method: 'POST',
    })
    .then (response => {
        if (response.status === 204) {
            // Update user's followers count
            const profileContainer = document.querySelector('#profileview')
            profileContainer.querySelector('#focount').innerHTML = parseInt(profileContainer.querySelector('#focount').innerHTML) - 1;

            // Change button text and function
            const button = profileContainer.querySelector('.followbutton');
            button.innerHTML = 'FOLLOW';
            button.onclick = () => addfollow(user);
        }
    })
}

function editPost(id) {

    // Get post div
    const post = document.getElementById(id);
    const content = post.querySelector('.content').innerHTML;

    // Create form with textarea and submit button
    const form = document.createElement('form');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    textarea.focus();

    const edit = document.createElement('input');
    edit.setAttribute('type', 'submit');
    edit.setAttribute('value', 'EDIT');

    const cancel = document.createElement('button');
    cancel.innerHTML = 'CANCEL';
    
    const buttons = document.createElement('div');
    buttons.setAttribute('class', 'buttons');

    buttons.appendChild(edit);
    buttons.appendChild(cancel);
    form.appendChild(textarea);
    form.appendChild(buttons);

    post.querySelector('.content').innerHTML = '';
    post.querySelector('.content').appendChild(form);
    
    // Hide post infos
    const infos = post.querySelector('.infos');
    infos.style.display = 'none';

    // Cancel button
    cancel.onclick = () => {
        // Show content
        const newcontent = form.querySelector('textarea').value;
        post.querySelector('.content').innerHTML = newcontent;
        // Show infos
        infos.style.display = 'flex';
    }

    // Add onclick function to form
    form.onsubmit = () => {
        const newcontent = form.querySelector('textarea').value;
        const csrfToken = getCookie('csrftoken');

        // Check length of post body
        if (newcontent === '' || newcontent.length > 512) {
        return false;
        } 

        fetch(`/editpost/${id}`, {
            method: 'PUT',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                content: newcontent,
            })
        })
        .then(response => {
            if (response.status === 201) {
                // Add new content to div
                post.querySelector('.content').innerHTML = newcontent;
                // Show post infos
                infos.style.display = 'flex';
                return false;
            } else {
                return false;
            }
        });
        return false;
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
