/* The service that sits between the api and the actual post repository
 */

package com.indiedev.backend.posts;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final FileRepository fileRepository;

    public PostService(PostRepository postRepository, FileRepository fileRepository) {
        this.postRepository = postRepository;
        this.fileRepository = fileRepository;
    }

    // Save a Post and a PostFile (stored together in a wrapper) to their respective repositories
    public PostWrapper savePost(PostWrapper postWrapper) {
        PostWrapper confirmationWrapper = new PostWrapper();
        confirmationWrapper.setPost(postRepository.save(postWrapper.getPost()));

        List<PostFile> files = postWrapper.getFiles();
        List<PostFile> newFiles = new ArrayList<>();
        for (PostFile f : files) {
            f.setPostId(postWrapper.getPost().getId());
            newFiles.add(fileRepository.save(f));
        }

        confirmationWrapper.setFiles(newFiles);
        return confirmationWrapper;
    }

    // Get posts by criteria

    public List<Post> getAllPosts() { return postRepository.findAll(); }

    public List<Post> getAllPostsByUser(Long posterId) { return postRepository.findByPosterId(posterId); }

    public Post getPostById(Long postId) { return postRepository.findPostById(postId); }

    // Get files by criteria

    public List<PostFile> getAllFiles() { return fileRepository.findAll(); }

    public List<PostFile> getFilesByPostId(Long postId) { return fileRepository.findByPostId(postId); }

    public PostFile getFileById(Long fileId) { return fileRepository.findFileById(fileId); }

}
